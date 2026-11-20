import type { Product } from '../../types/database';
import ProductCard from './ProductCard';
import CatalogTagline from './CatalogTagline';

interface ProductGridProps {
  products: Product[];
  onAddToCart?: (productId: string) => void;
  tagline?: string;
}

/**
 * Editorial masonry-style product grid.
 *
 * Layout pattern (repeating every 8 products on desktop ≥md):
 *   Block A (positions 0-2):
 *     • Product 0 — large card spanning 2 rows, column 1
 *     • Product 1 — normal card, column 2
 *     • Product 2 — normal card, column 3
 *     → tagline centered below
 *
 *   Block B (positions 3-5):
 *     • Product 3 — normal card, column 1
 *     • Product 4 — normal card, column 2
 *     • Product 5 — large card spanning 2 rows, column 3
 *
 *   Block C (positions 6-7):
 *     • Product 6 — normal card, column 1
 *     • Product 7 — normal card, column 2
 *     → tagline below
 *
 * On mobile: simple 2-column grid, all same size.
 */
export default function ProductGrid({ products, onAddToCart, tagline }: ProductGridProps) {
  if (products.length === 0) return null;

  // Build layout blocks for the editorial grid
  const blocks: React.ReactNode[] = [];
  let idx = 0;

  while (idx < products.length) {
    const blockNum = blocks.length;

    if (blockNum % 3 === 0) {
      // Block A: large-left pattern (3 products)
      const p0 = products[idx];
      const p1 = products[idx + 1];
      const p2 = products[idx + 2];

      blocks.push(
        <div key={`block-${blockNum}`} className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6 md:gap-x-5 md:gap-y-8">
          {/* Large card col 1, spans 2 rows on desktop */}
          <div className="col-span-1 md:row-span-2">
            <ProductCard product={p0} variant="large" onAddToCart={onAddToCart} />
          </div>
          {p1 && (
            <div className="col-span-1">
              <ProductCard product={p1} onAddToCart={onAddToCart} />
            </div>
          )}
          {p2 && (
            <div className="col-span-1">
              <ProductCard product={p2} onAddToCart={onAddToCart} />
            </div>
          )}
        </div>
      );
      idx += 3;
    } else if (blockNum % 3 === 1) {
      // Insert tagline before block B
      if (tagline) {
        blocks.push(<CatalogTagline key={`tagline-${blockNum}`} text={tagline} />);
      }

      // Block B: large-right pattern (3 products)
      const p0 = products[idx];
      const p1 = products[idx + 1];
      const p2 = products[idx + 2];

      blocks.push(
        <div key={`block-${blockNum}`} className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6 md:gap-x-5 md:gap-y-8">
          {p0 && (
            <div className="col-span-1">
              <ProductCard product={p0} onAddToCart={onAddToCart} />
            </div>
          )}
          {p1 && (
            <div className="col-span-1">
              <ProductCard product={p1} onAddToCart={onAddToCart} />
            </div>
          )}
          {p2 && (
            <div className="col-span-1 md:row-span-2">
              <ProductCard product={p2} variant="large" onAddToCart={onAddToCart} />
            </div>
          )}
        </div>
      );
      idx += 3;
    } else {
      // Block C: remaining products as normal 2-col
      const remaining = products.slice(idx, idx + 2);

      blocks.push(
        <div key={`block-${blockNum}`} className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6 md:gap-x-5 md:gap-y-8">
          {remaining.map((p) => (
            <div key={p.id} className="col-span-1">
              <ProductCard product={p} onAddToCart={onAddToCart} />
            </div>
          ))}
        </div>
      );
      idx += remaining.length;

      // Insert tagline after block C
      if (tagline && idx < products.length) {
        blocks.push(<CatalogTagline key={`tagline-${blockNum}-end`} text={tagline} />);
      }
    }
  }

  return <div className="space-y-8 md:space-y-10">{blocks}</div>;
}
