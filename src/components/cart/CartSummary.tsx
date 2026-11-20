import { Link } from 'react-router';
import { formatPrice } from '../../lib/utils';
import Button from '../ui/Button';
import type { CartProduct } from '../../types/cart';

interface CartSummaryProps {
  items: CartProduct[];
  onDmToOrder: () => void;
  onClearCart: () => void;
  loading?: boolean;
}

export default function CartSummary({ items, onDmToOrder, onClearCart, loading = false }: CartSummaryProps) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasUnavailable = items.some((item) => !item.isAvailable);
  const availableItems = items.filter(item => item.isAvailable);

  return (
    <div className="border border-border bg-white p-6 space-y-5">
      <h2 className="font-serif text-lg text-text">Order Summary</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-text-muted">
          <span>Items</span>
          <span>{totalItems}</span>
        </div>
        {hasUnavailable && (
          <div className="flex justify-between text-text-muted">
            <span>Available</span>
            <span>{availableItems.reduce((s, i) => s + i.quantity, 0)}</span>
          </div>
        )}
        <div className="flex justify-between text-text font-medium border-t border-border-light pt-3">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
      </div>

      {hasUnavailable && (
        <p className="text-xs text-warning bg-warning/5 border border-warning/20 p-3">
          Some items in your cart are no longer available. Please remove them before ordering.
        </p>
      )}

      <div className="space-y-3 pt-2">
        <Button
          onClick={onDmToOrder}
          disabled={items.length === 0 || hasUnavailable || loading}
          loading={loading}
          className="w-full"
          size="lg"
        >
          DM to Order
        </Button>

        <Link to="/catalog" className="block">
          <Button variant="outline" className="w-full" size="sm">
            Continue Shopping
          </Button>
        </Link>

        <Button
          onClick={onClearCart}
          variant="ghost"
          className="w-full"
          size="sm"
          disabled={items.length === 0}
        >
          Clear Cart
        </Button>
      </div>

      <p className="text-[11px] text-text-muted/60 leading-relaxed">
        Your order details will be copied to your clipboard. You will then open Instagram to send us a DM with your order. Final prices are confirmed from our catalogue at the time of order.
      </p>
    </div>
  );
}
