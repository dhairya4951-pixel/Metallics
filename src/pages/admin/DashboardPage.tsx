import { useState, useEffect } from 'react';
import { Package, FolderOpen, ShoppingCart, Clock, CheckCircle, CircleCheckBig } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import StatsCard from '../../components/admin/StatsCard';
import Spinner from '../../components/ui/Spinner';

interface DashboardStats {
  activeProducts: number;
  activeCategories: number;
  totalOrders: number;
  awaitingDm: number;
  confirmed: number;
  completed: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [productsRes, categoriesRes, ordersRes, awaitingRes, confirmedRes, completedRes] =
          await Promise.all([
            supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_available', true),
            supabase.from('categories').select('id', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('orders').select('id', { count: 'exact', head: true }),
            supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'awaiting_dm'),
            supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
            supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
          ]);

        setStats({
          activeProducts: productsRes.count ?? 0,
          activeCategories: categoriesRes.count ?? 0,
          totalOrders: ordersRes.count ?? 0,
          awaitingDm: awaitingRes.count ?? 0,
          confirmed: confirmedRes.count ?? 0,
          completed: completedRes.count ?? 0,
        });
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-text">Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">Overview of your catalogue</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          title="Active Products"
          value={stats?.activeProducts ?? '—'}
          subtitle="Available in catalogue"
          icon={<Package size={20} />}
        />
        <StatsCard
          title="Categories"
          value={stats?.activeCategories ?? '—'}
          subtitle="Active categories"
          icon={<FolderOpen size={20} />}
        />
        <StatsCard
          title="Total Orders"
          value={stats?.totalOrders ?? '—'}
          subtitle="All time"
          icon={<ShoppingCart size={20} />}
        />
        <StatsCard
          title="Awaiting DM"
          value={stats?.awaitingDm ?? '—'}
          subtitle="Need Instagram contact"
          icon={<Clock size={20} />}
        />
        <StatsCard
          title="Confirmed"
          value={stats?.confirmed ?? '—'}
          subtitle="Payment confirmed"
          icon={<CheckCircle size={20} />}
        />
        <StatsCard
          title="Completed"
          value={stats?.completed ?? '—'}
          subtitle="Fulfilled orders"
          icon={<CircleCheckBig size={20} />}
        />
      </div>
    </div>
  );
}
