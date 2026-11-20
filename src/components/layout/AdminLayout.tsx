import { useState } from 'react';
import { Outlet, Link } from 'react-router';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-ivory">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-text/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Admin top bar */}
        <header className="flex items-center gap-4 border-b border-border bg-white px-4 py-3 lg:px-8">
          <button
            className="lg:hidden text-text-muted hover:text-text"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          {user && (
            <span className="text-xs text-text-muted hidden sm:block">
              {user.email}
            </span>
          )}
          <Link
            to="/"
            className="text-xs text-text-muted hover:text-burgundy transition-colors"
          >
            View Store →
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
