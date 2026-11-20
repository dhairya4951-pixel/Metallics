import { Link } from 'react-router';
import { useState, useEffect } from 'react';
import { getSettings } from '../../services/settings';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [brandName, setBrandName] = useState('Metallics');
  const [tagline, setTagline] = useState('Jewelry that highlights your individuality');

  useEffect(() => {
    getSettings().then(s => {
      setBrandName(s.brand_name);
      setTagline(s.brand_tagline);
    });
  }, []);

  return (
    <footer className="border-t border-border bg-ivory mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Brand */}
          <Link
            to="/"
            className="font-serif text-xl tracking-wider text-text hover:text-burgundy transition-colors"
          >
            {brandName}
          </Link>

          {/* Tagline */}
          <p className="text-sm text-text-muted italic font-serif max-w-sm">
            {tagline}
          </p>

          {/* Links */}
          <nav className="flex gap-6 text-xs text-text-muted" aria-label="Footer">
            <Link to="/about" className="hover:text-text transition-colors">
              About Us
            </Link>
            <Link to="/catalog" className="hover:text-text transition-colors">
              Catalog
            </Link>
            <Link to="/cart" className="hover:text-text transition-colors">
              Cart
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-text-muted/60">
            © {currentYear} {brandName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
