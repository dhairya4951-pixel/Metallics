import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Package, AlertCircle, Clock } from 'lucide-react';
import { getOrderByToken } from '../../services/orders';
import { getPublicImageUrl } from '../../services/images';
import { formatPrice, formatOrderStatus } from '../../lib/utils';
import type { Order, OrderItem } from '../../types/database';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

const statusColors: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  awaiting_dm: 'warning',
  contacted: 'info',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'error',
};

export default function PublicOrderPage() {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    getOrderByToken(token).then(result => {
      if (result.error || !result.order) {
        setError(result.error || 'Order not found');
      } else {
        setOrder(result.order);
        setOrderItems(result.items);
      }
      setLoading(false);
    });
  }, [token]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <Spinner />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <EmptyState
          title="Order not found"
          message="We could not find an order with this link. Please check the URL or contact us on Instagram."
          icon={<AlertCircle size={48} strokeWidth={1} />}
          action={
            <Link
              to="/catalog"
              className="text-sm text-burgundy hover:underline"
            >
              Browse Catalogue
            </Link>
          }
        />
      </div>
    );
  }

  const createdDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-serif text-2xl md:text-3xl text-text">Order Details</h1>
        <div className="flex items-center justify-center gap-3 mt-3">
          <span className="font-serif text-lg text-burgundy tracking-wider">{order.order_code}</span>
          <Badge variant={statusColors[order.status] || 'default'}>
            {formatOrderStatus(order.status)}
          </Badge>
        </div>
        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-text-muted">
          <Clock size={12} />
          <span>{createdDate}</span>
        </div>
      </div>

      {/* Order items */}
      <div className="border border-border bg-white divide-y divide-border">
        <div className="px-6 py-4">
          <h2 className="text-sm font-medium text-text uppercase tracking-wider flex items-center gap-2">
            <Package size={14} />
            Items ({order.total_items})
          </h2>
        </div>

        {orderItems.map(item => (
          <div key={item.id} className="px-6 py-4 flex gap-4">
            {/* Image */}
            <div className="w-16 h-20 shrink-0 bg-ivory-dark overflow-hidden">
              {item.image_path ? (
                <img
                  src={getPublicImageUrl(item.image_path)}
                  alt={item.product_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted/40">
                  <Package size={20} />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  {item.product_slug ? (
                    <Link
                      to={`/product/${item.product_slug}`}
                      className="text-sm font-medium text-text hover:text-burgundy transition-colors"
                    >
                      {item.product_name}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-text">{item.product_name}</p>
                  )}
                  {item.sku && (
                    <p className="text-[11px] text-text-muted mt-0.5">SKU: {item.sku}</p>
                  )}
                </div>
                <p className="text-sm font-medium text-text whitespace-nowrap">
                  {formatPrice(item.line_total, order.currency_code)}
                </p>
              </div>
              <div className="mt-1 text-xs text-text-muted">
                <span>{formatPrice(item.unit_price, order.currency_code)}</span>
                <span className="mx-1.5">×</span>
                <span>{item.quantity}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Totals */}
        <div className="px-6 py-5 space-y-2">
          <div className="flex justify-between text-sm text-text-muted">
            <span>Total items</span>
            <span>{order.total_items}</span>
          </div>
          <div className="flex justify-between text-base font-medium text-text pt-1 border-t border-border-light">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal, order.currency_code)}</span>
          </div>
        </div>
      </div>

      {/* Customer note */}
      {order.customer_note && (
        <div className="mt-6 border border-border bg-ivory-dark/50 p-5">
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Order Note</h3>
          <p className="text-sm text-text leading-relaxed">{order.customer_note}</p>
        </div>
      )}

      {/* Status info */}
      {order.status === 'awaiting_dm' && (
        <div className="mt-6 border border-warning/30 bg-warning/5 p-5 text-sm">
          <p className="font-medium text-text">Awaiting your Instagram DM</p>
          <p className="text-text-muted mt-1">
            Please send us a message on Instagram with your order details so we can confirm your order.
          </p>
        </div>
      )}

      {/* Back to catalogue */}
      <div className="mt-8 text-center">
        <Link
          to="/catalog"
          className="text-sm text-text-muted hover:text-burgundy transition-colors"
        >
          ← Continue Shopping
        </Link>
      </div>
    </div>
  );
}
