import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { Search, Eye } from 'lucide-react';
import { getOrders } from '../../services/orders';
import { formatPrice, formatOrderStatus } from '../../lib/utils';
import { useDebounce } from '../../hooks/useDebounce';
import { ORDER_STATUSES } from '../../lib/constants';
import type { Order } from '../../types/database';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

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

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-text">Orders</h1>
        <p className="text-sm text-text-muted mt-1">
          {totalCount} order{totalCount !== 1 ? 's' : ''}
        </p>
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
    </div>
  );
}
