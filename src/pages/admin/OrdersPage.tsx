import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { Search, Eye, Plus, Trash2 } from 'lucide-react';
import { getOrders, createOrder, updateOrderStatus } from '../../services/orders';
import { formatPrice, formatOrderStatus } from '../../lib/utils';
import { useDebounce } from '../../hooks/useDebounce';
import { ORDER_STATUSES } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import type { Order, OrderStatus, Product } from '../../types/database';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 25;
  const debouncedSearch = useDebounce(search, 300);

  // Add Order Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [newOrderItems, setNewOrderItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [customerNote, setCustomerNote] = useState('');
  const [newOrderStatus, setNewOrderStatus] = useState<OrderStatus>('confirmed');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderFormError, setOrderFormError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const result = await getOrders({
      search: debouncedSearch,
      status: statusFilter,
      page,
      pageSize,
    });
    setOrders(result.data);
    setTotalCount(result.count);
    setLoading(false);
  }, [debouncedSearch, statusFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Fetch available products for order creation modal
  const openAddOrderModal = async () => {
    setOrderFormError(null);
    setCustomerNote('');
    setNewOrderStatus('confirmed');
    setNewOrderItems([]);

    const { data } = await supabase
      .from('products')
      .select('id, name, price, sku, is_available')
      .eq('is_available', true)
      .order('name', { ascending: true });

    const products = (data as Product[]) || [];
    setAvailableProducts(products);
    if (products.length > 0) {
      setNewOrderItems([{ productId: products[0].id, quantity: 1 }]);
    }
    setModalOpen(true);
  };

  const handleAddItemRow = () => {
    if (availableProducts.length === 0) return;
    setNewOrderItems(prev => [...prev, { productId: availableProducts[0].id, quantity: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    setNewOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemProductChange = (index: number, productId: string) => {
    setNewOrderItems(prev => prev.map((item, i) => i === index ? { ...item, productId } : item));
  };

  const handleItemQuantityChange = (index: number, quantity: number) => {
    const qty = Math.max(1, Math.min(99, quantity || 1));
    setNewOrderItems(prev => prev.map((item, i) => i === index ? { ...item, quantity: qty } : item));
  };

  // Calculate live modal subtotal
  const modalSubtotal = newOrderItems.reduce((acc, item) => {
    const prod = availableProducts.find(p => p.id === item.productId);
    return acc + (prod ? prod.price * item.quantity : 0);
  }, 0);

  const modalTotalUnits = newOrderItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrderItems.length === 0) {
      setOrderFormError('Please select at least one product.');
      return;
    }

    setSubmittingOrder(true);
    setOrderFormError(null);

    const { data, error } = await createOrder({
      items: newOrderItems.map(i => ({ product_id: i.productId, quantity: i.quantity })),
      customer_note: customerNote.trim() || undefined,
    });

    if (error || !data) {
      setOrderFormError(error || 'Failed to create order.');
      setSubmittingOrder(false);
      return;
    }

    // If status is different from awaiting_dm, update order status
    if (newOrderStatus !== 'awaiting_dm') {
      const { data: createdOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('order_code', data.order_code)
        .maybeSingle();

      if (createdOrder) {
        await updateOrderStatus(createdOrder.id, newOrderStatus);
      }
    }

    setSubmittingOrder(false);
    setModalOpen(false);
    fetchOrders();
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl text-text">Orders</h1>
          <p className="text-sm text-text-muted mt-1">
            {totalCount} order{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Button size="sm" onClick={openAddOrderModal}>
          <Plus size={14} />
          Add Order
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order code…"
            className="w-full border border-border bg-white pl-9 pr-4 py-2 text-sm text-text placeholder:text-text-muted focus:border-burgundy focus:outline-none transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-border bg-white px-3 py-2 text-sm text-text focus:border-burgundy focus:outline-none appearance-none"
        >
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map(s => (
            <option key={s} value={s}>{formatOrderStatus(s)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders found"
          message={search || statusFilter
            ? 'No orders match your current filters.'
            : 'Orders will appear here when customers submit them through the catalogue.'}
        />
      ) : (
        <>
          <div className="border border-border bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-ivory">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted hidden sm:table-cell">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-border-light last:border-0 hover:bg-ivory/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text font-mono text-xs">
                      {order.order_code}
                    </td>
                    <td className="px-4 py-3 text-text-muted hidden sm:table-cell">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{order.total_items}</td>
                    <td className="px-4 py-3">{formatPrice(order.subtotal, order.currency_code)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(order.status)}>
                        {formatOrderStatus(order.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-xs text-burgundy hover:underline"
                      >
                        <Eye size={12} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-text-muted">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Order Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Order"
        size="lg"
      >
        <form onSubmit={handleCreateOrderSubmit} className="space-y-5">
          {orderFormError && (
            <div className="p-3 text-xs text-error bg-error/10 border border-error/20">
              {orderFormError}
            </div>
          )}

          {/* Product Items Selection with Quantities */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Order Items ({modalTotalUnits} total)
              </label>
              <button
                type="button"
                onClick={handleAddItemRow}
                disabled={availableProducts.length === 0}
                className="text-xs text-burgundy hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Plus size={12} /> Add Item
              </button>
            </div>

            {availableProducts.length === 0 ? (
              <p className="text-sm text-text-muted italic py-2">
                No active products available in catalogue. Please create a product first.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {newOrderItems.map((item, index) => {
                  const selectedProduct = availableProducts.find(p => p.id === item.productId);
                  return (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2.5 bg-ivory/50 border border-border"
                    >
                      {/* Product Selector */}
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemProductChange(index, e.target.value)}
                        className="flex-1 w-full border border-border bg-white px-3 py-1.5 text-xs text-text focus:border-burgundy focus:outline-none"
                      >
                        {availableProducts.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {formatPrice(p.price)} {p.sku ? `(${p.sku})` : ''}
                          </option>
                        ))}
                      </select>

                      {/* Quantity Input */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted whitespace-nowrap">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={item.quantity}
                          onChange={(e) => handleItemQuantityChange(index, parseInt(e.target.value) || 1)}
                          className="w-16 border border-border bg-white px-2 py-1.5 text-xs text-center text-text focus:border-burgundy focus:outline-none"
                        />
                      </div>

                      {/* Line Total */}
                      <div className="text-xs font-medium text-text min-w-[70px] text-right">
                        {selectedProduct ? formatPrice(selectedProduct.price * item.quantity) : '—'}
                      </div>

                      {/* Remove item button */}
                      {newOrderItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(index)}
                          className="p-1 text-text-muted hover:text-error transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total summary */}
            {newOrderItems.length > 0 && (
              <div className="flex justify-between items-center pt-2 border-t border-border text-sm">
                <span className="font-medium text-text">Estimated Subtotal:</span>
                <span className="font-serif text-base text-burgundy font-medium">
                  {formatPrice(modalSubtotal)}
                </span>
              </div>
            )}
          </div>

          {/* Customer Note / Contact Info */}
          <div>
            <Input
              label="Customer Note / Info (optional)"
              placeholder="e.g. @customer_insta, Phone number, or special delivery note"
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
            />
          </div>

          {/* Order Status */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5">
              Initial Order Status
            </label>
            <select
              value={newOrderStatus}
              onChange={(e) => setNewOrderStatus(e.target.value as OrderStatus)}
              className="w-full border border-border bg-white px-3 py-2 text-sm text-text focus:border-burgundy focus:outline-none"
            >
              {ORDER_STATUSES.map(s => (
                <option key={s} value={s}>{formatOrderStatus(s)}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={submittingOrder}
              disabled={availableProducts.length === 0 || newOrderItems.length === 0}
            >
              Create Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
