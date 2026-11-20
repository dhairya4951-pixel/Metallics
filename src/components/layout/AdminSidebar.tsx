import { NavLink } from 'react-router';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderOpen,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

const ADMIN_NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/categories', label: 'Categories', icon: FolderOpen },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

interface AdminSidebarProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export default function AdminSidebar({ collapsed = false, onNavigate }: AdminSidebarProps) {
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <aside
      className={cn(
        'flex flex-col bg-white border-r border-border h-full',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border-light">
        <div className="h-8 w-8 bg-burgundy flex items-center justify-center shrink-0">
          <span className="text-white font-serif text-sm font-bold">M</span>
        </div>
        {!collapsed && (
          <span className="font-serif text-sm tracking-wider text-text">
            Admin Panel
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1" aria-label="Admin navigation">
        {ADMIN_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'text-burgundy bg-burgundy/5 font-medium'
                  : 'text-text-muted hover:text-text hover:bg-ivory-dark'
              )
            }
          >
            <Icon size={18} />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-border-light p-2">
        {!collapsed && user && (
          <p className="px-3 py-1 text-[10px] text-text-muted truncate">
            {user.email}
          </p>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-text-muted hover:text-error transition-colors cursor-pointer"
        >
          <LogOut size={18} />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}
