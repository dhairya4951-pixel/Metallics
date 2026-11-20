import { useState } from 'react';
import { ShoppingBag, Check } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import QuantityControl from '../cart/QuantityControl';
import { formatPrice } from '../../lib/utils';
import type { Product } from '../../types/database';

interface ProductInfoProps {
  product: Product;
  onAddToCart: (quantity: number) => void;
}

export default function ProductInfo({ product, onAddToCart }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const isOutOfStock = product.stock_quantity !== undefined && product.stock_quantity === 0;
  const isAvailable = product.is_available && !isOutOfStock;
  const maxPurchaseQty = product.stock_quantity !== undefined ? Math.max(1, Math.min(product.stock_quantity, 99)) : 99;

  const handleAdd = () => {
    onAddToCart(quantity);
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

      {/* Availability / Stock Status */}
      {isOutOfStock ? (
        <Badge variant="error">Out of Stock</Badge>
      ) : !product.is_available ? (
        <Badge variant="warning">Currently Unavailable</Badge>
      ) : product.stock_quantity !== undefined && product.stock_quantity <= 5 ? (
        <Badge variant="warning">Only {product.stock_quantity} left in stock</Badge>
      ) : null}

      {/* Description */}
      {product.description && (
        <div className="border-t border-border-light pt-6">
          <p className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">
            {product.description}
          </p>
        </div>
      )}

      {/* Quantity & Add to Cart */}
      <div className="border-t border-border-light pt-6 space-y-4">
        {isAvailable && (
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-text-muted font-medium">
              Quantity
            </label>
            <QuantityControl
              quantity={quantity}
              onChange={setQuantity}
              min={1}
              max={maxPurchaseQty}
            />
          </div>
        )}

        <Button
          onClick={handleAdd}
          disabled={!isAvailable}
          size="lg"
          className="w-full sm:w-auto"
          variant={added ? 'secondary' : 'primary'}
        >
          {added ? (
            <>
              <Check size={18} />
              Added {quantity > 1 ? `(${quantity})` : ''} to Cart
            </>
          ) : (
            <>
              <ShoppingBag size={18} />
              {isOutOfStock ? 'Out of Stock' : product.is_available ? 'Add to Cart' : 'Unavailable'}
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
