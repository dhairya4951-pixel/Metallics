import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../contexts/CartContext';
import { getPublicImageUrl } from '../../services/images';
import { createOrder } from '../../services/orders';
import { useClipboard } from '../../hooks/useClipboard';
import { generateOrderSummaryText } from '../../components/cart/OrderSummaryText';
import { formatPrice } from '../../lib/utils';
import type { CartProduct } from '../../types/cart';
import type { Product } from '../../types/database';
import CartItemRow from '../../components/cart/CartItem';
import CartSummary from '../../components/cart/CartSummary';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const NOTE_MAX_LENGTH = 500;

export default function CartPage() {
  const { items, totalItems, updateQuantity, removeItem, clearCart } = useCart();
  const [cartProducts, setCartProducts] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [customerNote, setCustomerNote] = useState('');

  const navigate = useNavigate();
  const { copy } = useClipboard();
  const submittingRef = useRef(false);

  // Fetch real product data for all cart items
  const fetchCartProducts = useCallback(async () => {
    if (items.length === 0) {
      setCartProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const productIds = items.map(i => i.productId);

    const { data, error } = await supabase
      .from('products')
      .select(`
        id, name, slug, price, is_available,
        images:product_images(id, storage_path, is_primary, display_order)
      `)
      .in('id', productIds);

    if (error) {
      console.error('Failed to fetch cart products:', error.message);
      setLoading(false);
      return;
    }

    const productMap = new Map<string, Product>();
    if (data) {
      for (const p of data) {
        productMap.set(p.id, p as unknown as Product);
      }
    }

    const enriched: CartProduct[] = items.map(item => {
      const product = productMap.get(item.productId);

      if (!product) {
        return {
          productId: item.productId,
          quantity: item.quantity,
          name: 'Product no longer available',
          slug: '',
          price: 0,
          imagePath: null,
          isAvailable: false,
        };
      }

      // Get primary image
      const images = (product.images || []) as unknown as { id: string; storage_path: string; is_primary: boolean; display_order: number }[];
      const primary = images.find(img => img.is_primary) || images[0];
      const imagePath = primary ? getPublicImageUrl(primary.storage_path) : null;

      return {
        productId: item.productId,
        quantity: item.quantity,
        name: product.name,
        slug: product.slug,
        price: product.price,
        imagePath,
        isAvailable: product.is_available,
      };
    });

    setCartProducts(enriched);
    setLoading(false);
  }, [items]);

  useEffect(() => {
    fetchCartProducts();
  }, [fetchCartProducts]);

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, Math.min(quantity, 99));
    }
  };

  const handleRemove = (productId: string) => {
    removeItem(productId);
  };

  const handleClearCart = () => {
    if (confirm('Remove all items from your cart?')) {
      clearCart();
    }
  };

  const handleDmToOrder = async () => {
    // Prevent double-submit
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setOrderError(null);

    try {
      // 1. Validate: only available items
      const availableItems = cartProducts.filter(p => p.isAvailable);
      if (availableItems.length === 0) {
        setOrderError('No available items in your cart.');
        return;
      }

      // 2. Build request (product_id + quantity only — no prices from frontend)
      const orderItems = availableItems.map(p => ({
        product_id: p.productId,
        quantity: p.quantity,
      }));

      // 3. Call the secure Edge Function
      const { data, error } = await createOrder({
        items: orderItems,
        customer_note: customerNote.trim() || undefined,
      });

      if (error || !data) {
        setOrderError(error || 'Order creation failed. Please try again.');
        return;
      }

      // 4. Generate order summary text using backend-returned prices
      const baseUrl = window.location.origin;
      const summaryText = generateOrderSummaryText({
        orderCode: data.order_code,
        items: data.items.map(item => ({
          name: item.product_name,
          quantity: item.quantity,
          unitPrice: formatPrice(item.unit_price, data.currency_code),
          subtotal: formatPrice(item.line_total, data.currency_code),
          productUrl: `${baseUrl}/product/${item.product_slug}`,
        })),
        totalItems: data.total_items,
        subtotal: formatPrice(data.subtotal, data.currency_code),
        publicOrderUrl: `${baseUrl}/order/${data.public_token}`,
      });

      // 5. Attempt clipboard copy (non-blocking — we report result on confirmation page)
      let clipboardSuccess = false;
      try {
        clipboardSuccess = await copy(summaryText);
      } catch {
        clipboardSuccess = false;
      }

      // 6. Clear cart after successful order
      clearCart();
      setCustomerNote('');

      // 7. Navigate to confirmation page with order data
      navigate('/order/confirmation', {
        state: {
          orderCode: data.order_code,
          publicToken: data.public_token,
          totalItems: data.total_items,
          subtotal: data.subtotal,
          currencyCode: data.currency_code,
          items: data.items,
          summaryText,
          clipboardSuccess,
        },
        replace: true,
      });
    } catch (err) {
      setOrderError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Your cart is preserved — please try again.'
      );
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  // Empty state
  if (!loading && items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <EmptyState
          title="Your cart is empty"
          message="Browse our collection and add your favourite pieces to get started."
          icon={<ShoppingBag size={48} strokeWidth={1} />}
          action={
            <Link to="/catalog">
              <Button>
                Browse Catalogue
                <ArrowRight size={16} />
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-text">
            Shopping Cart
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </p>
        </div>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft size={14} />
          Continue Shopping
        </Link>
      </div>

      {/* Order error */}
      {orderError && (
        <div className="mb-6 border border-error/30 bg-error/5 p-4 text-sm text-error">
          <p className="font-medium">Order could not be placed</p>
          <p className="mt-1 text-error/80">{orderError}</p>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Cart items */}
          <div className="lg:col-span-2">
            <div>
              {cartProducts.map((item) => (
                <CartItemRow
                  key={item.productId}
                  item={item}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemove}
                />
              ))}
            </div>

            {/* Customer note */}
            <div className="mt-6 border-t border-border pt-6">
              <label htmlFor="customer-note" className="text-sm font-medium text-text block mb-2">
                Order Note <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <textarea
                id="customer-note"
                rows={3}
                maxLength={NOTE_MAX_LENGTH}
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Any special requests or notes for your order…"
                className="w-full border border-border bg-white px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-burgundy focus:outline-none transition-colors resize-y"
                disabled={submitting}
              />
              <p className="text-[10px] text-text-muted mt-1 text-right">
                {customerNote.length}/{NOTE_MAX_LENGTH}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <CartSummary
              items={cartProducts}
              onDmToOrder={handleDmToOrder}
              onClearCart={handleClearCart}
              loading={submitting}
            />
          </div>
        </div>
      )}
    </div>
  );
}
