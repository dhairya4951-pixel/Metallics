import { useState } from 'react';
import { ShoppingBag, Check } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { formatPrice } from '../../lib/utils';
import type { Product } from '../../types/database';

interface ProductInfoProps {
  product: Product;
  onAddToCart: () => void;
}

export default function ProductInfo({ product, onAddToCart }: ProductInfoProps) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAddToCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Category badge */}
      {product.category && (
        <Badge variant="primary">{product.category.name}</Badge>
      )}

      {/* Name */}
      <h1 className="font-serif text-2xl md:text-3xl italic text-text leading-snug">
        {product.name}
      </h1>

      {/* Price */}
      <p className="text-lg text-text-muted">
        {formatPrice(product.price)}
      </p>

      {/* Availability */}
      {!product.is_available && (
        <Badge variant="warning">Currently Unavailable</Badge>
      )}

      {/* Description */}
      {product.description && (
        <div className="border-t border-border-light pt-6">
          <p className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">
            {product.description}
          </p>
        </div>
      )}

      {/* Add to Cart */}
      <div className="border-t border-border-light pt-6">
        <Button
          onClick={handleAdd}
          disabled={!product.is_available}
          size="lg"
          className="w-full sm:w-auto"
          variant={added ? 'secondary' : 'primary'}
        >
          {added ? (
            <>
              <Check size={18} />
              Added to Cart
            </>
          ) : (
            <>
              <ShoppingBag size={18} />
              {product.is_available ? 'Add to Cart' : 'Unavailable'}
            </>
          )}
        </Button>
      </div>

      {/* SKU */}
      {product.sku && (
        <p className="text-xs text-text-muted/60">
          SKU: {product.sku}
        </p>
      )}
    </div>
  );
}
