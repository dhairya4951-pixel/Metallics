import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router';
import { Search, ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { cn } from '../../lib/utils';
import { getSettings } from '../../services/settings';

const NAV_LINKS = [
  { to: '/about', label: 'About Us' },
  { to: '/', label: 'Collection', end: true },
  { to: '/catalog', label: 'Catalog' },
];

export default function Header() {
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [brandName, setBrandName] = useState('Metallics');

  useEffect(() => {
    getSettings().then(s => setBrandName(s.brand_name));
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur-sm border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Left nav — desktop */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'text-sm tracking-wide transition-colors duration-200',
                    isActive
                      ? 'text-burgundy font-medium'
                      : 'text-text-muted hover:text-text'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-text p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Centre brand */}
          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 font-serif text-xl sm:text-2xl lg:text-[1.75rem] tracking-wider text-text hover:text-burgundy transition-colors"
          >
            {brandName}
          </Link>

          {/* Right icons */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="text-text-muted hover:text-text transition-colors p-1"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            <Link
              to="/cart"
              className="relative text-text-muted hover:text-text transition-colors p-1"
              aria-label={`Shopping cart, ${totalItems} items`}
            >
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-burgundy text-[10px] font-semibold text-white">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search bar (expandable) */}
        {searchOpen && (
          <div className="border-t border-border-light py-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const q = (form.elements.namedItem('q') as HTMLInputElement).value.trim();
                if (q) {
                  setSearchOpen(false);
                  // Use native navigation to pass search param to catalog
                  window.location.href = `/catalog?search=${encodeURIComponent(q)}`;
                }
              }}
              className="flex items-center gap-3"
            >
              <Search size={16} className="text-text-muted shrink-0" />
              <input
                name="q"
                type="text"
                placeholder="Search our collection…"
                autoFocus
                className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-text-muted hover:text-text text-xs"
              >
                Close
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav
          className="lg:hidden border-t border-border-light bg-ivory"
          aria-label="Mobile navigation"
        >
          <div className="px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'block py-2.5 px-3 text-sm tracking-wide transition-colors',
                    isActive
                      ? 'text-burgundy font-medium bg-burgundy/5'
                      : 'text-text-muted hover:text-text'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
