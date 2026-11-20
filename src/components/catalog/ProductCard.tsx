import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { formatPrice } from '../../lib/utils';
import { getPublicImageUrl } from '../../services/images';
import type { Product } from '../../types/database';

interface ProductCardProps {
  product: Product;
  variant?: 'large' | 'normal';
  onAddToCart?: (productId: string) => void;
}

export default function ProductCard({ product, variant = 'normal', onAddToCart }: ProductCardProps) {
  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
  const imageUrl = primaryImage ? getPublicImageUrl(primaryImage.storage_path) : null;
  const [imgError, setImgError] = useState(false);

  const isLarge = variant === 'large';

  return (
    <article>
      <Link
        to={`/product/${product.slug}`}
        className="group block"
      >
        {/* Image */}
        <div className={`relative overflow-hidden bg-ivory-dark ${isLarge ? 'aspect-[3/4]' : 'aspect-[3/4]'}`}>
          {imageUrl && !imgError ? (
            <img
              src={imageUrl}
              alt={primaryImage?.alt_text || product.name}
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-center text-text-muted/40">
                <div className="font-serif text-4xl mb-2">✦</div>
                <p className="text-xs tracking-wider uppercase">No Image</p>
              </div>
            </div>
          )}

          {/* Circular arrow overlay */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart?.(product.id);
            }}
            className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-text-muted hover:bg-burgundy hover:text-white transition-colors duration-200 shadow-sm cursor-pointer"
            aria-label={`View ${product.name}`}
          >
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Info */}
        <div className="mt-3 space-y-1">
          <h3 className="font-serif text-sm italic text-text leading-snug">
            {product.category?.name ? `${product.category.name} ` : ''}
            &ldquo;{product.name}&rdquo;
          </h3>
          <p className="text-xs text-text-muted">
            Price: {formatPrice(product.price)}
          </p>
        </div>
      </Link>
    </article>
  );
}

/** Placeholder card matching the product card's shape, for empty-state demos */
export function ProductCardPlaceholder() {
  return (
    <div className="flex flex-col">
      <div className="bg-ivory-dark aspect-[3/4] flex items-center justify-center">
        <div className="text-center text-text-muted/30">
          <div className="font-serif text-4xl mb-2">✦</div>
          <p className="text-xs tracking-wider uppercase">No Image</p>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <div className="h-4 bg-border-light w-3/4" />
        <div className="h-3 bg-border-light w-1/3" />
      </div>
    </div>
  );
}
