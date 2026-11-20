import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { updateOrderStatus } from '../../services/orders';
import { formatPrice, formatOrderStatus } from '../../lib/utils';
import { getPublicImageUrl } from '../../services/images';
import { ORDER_STATUSES } from '../../lib/constants';
import type { Order, OrderItem } from '../../types/database';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

const statusVariant = (status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
  switch (status) {
    case 'awaiting_dm': return 'warning';
    case 'contacted': return 'primary';
    case 'confirmed': return 'success';
    case 'completed': return 'success';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (orderError || !orderData) {
      setLoading(false);
      return;
    }

    const { data: itemsData } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id)
      .order('id', { ascending: true });

    setOrder(orderData as Order);
    setItems((itemsData as OrderItem[]) || []);
    setNewStatus(orderData.status);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleUpdateStatus = async () => {
    if (!id || !newStatus || newStatus === order?.status) return;
    setUpdating(true);

    const { error } = await updateOrderStatus(id, newStatus);
    if (error) {
      alert(`Failed to update status: ${error}`);
    } else {
      fetchOrder();
    }
    setUpdating(false);
  };

  if (loading) return <Spinner />;

  if (!order) {
    return (
      <div>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Back to Orders
        </Link>
        <p className="text-sm text-text-muted">Order not found.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Back to Orders
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl text-text font-mono">{order.order_code}</h1>
            <p className="text-sm text-text-muted mt-1">
              Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <Badge variant={statusVariant(order.status)}>
            {formatOrderStatus(order.status)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 border border-border bg-white">
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-serif text-sm text-text">
              Order Items ({items.length})
            </h2>
          </div>
          <div className="divide-y divide-border-light">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                <div className="h-12 w-12 bg-ivory border border-border shrink-0 overflow-hidden">
                  {item.image_path ? (
                    <img
                      src={getPublicImageUrl(item.image_path)}
                      alt={item.product_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-text-muted text-[10px]">
                      No img
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{item.product_name}</p>
                  {item.sku && (
                    <p className="text-[10px] text-text-muted">SKU: {item.sku}</p>
                  )}
                </div>
                <div className="text-sm text-text-muted text-right shrink-0">
                  <p>{formatPrice(item.unit_price)} × {item.quantity}</p>
                  <p className="font-medium text-text">{formatPrice(item.line_total)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="space-y-4">
          {/* Totals */}
          <div className="border border-border bg-white p-4 space-y-3">
            <h2 className="font-serif text-sm text-text">Summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Items</span>
              <span className="text-text">{order.total_items}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border-light pt-2">
              <span className="font-medium text-text">Subtotal</span>
              <span className="font-medium text-text">
                {formatPrice(order.subtotal, order.currency_code)}
              </span>
            </div>
          </div>

          {/* Customer note */}
          {order.customer_note && (
            <div className="border border-border bg-white p-4 space-y-2">
              <h2 className="font-serif text-sm text-text">Customer Note</h2>
              <p className="text-sm text-text-muted whitespace-pre-wrap">{order.customer_note}</p>
            </div>
          )}

          {/* Status update */}
          <div className="border border-border bg-white p-4 space-y-3">
            <h2 className="font-serif text-sm text-text">Update Status</h2>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border border-border bg-white px-3 py-2 text-sm text-text focus:border-burgundy focus:outline-none appearance-none"
            >
              {ORDER_STATUSES.map(s => (
                <option key={s} value={s}>{formatOrderStatus(s)}</option>
              ))}
            </select>
            <Button
              size="sm"
              onClick={handleUpdateStatus}
              loading={updating}
              disabled={newStatus === order.status}
              className="w-full"
            >
              Update Status
            </Button>
          </div>

          {/* Public link */}
          <div className="border border-border bg-white p-4 space-y-2">
            <h2 className="font-serif text-sm text-text">Public Order Link</h2>
            <p className="text-xs text-text-muted break-all">
              {window.location.origin}/order/{order.public_token}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
