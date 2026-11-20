import { useState } from 'react';
import { Link } from 'react-router';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatPrice } from '../../lib/utils';
import type { CartProduct } from '../../types/cart';

interface CartItemProps {
  item: CartProduct;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const lineTotal = item.price * item.quantity;
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex gap-4 py-5 border-b border-border-light">
      {/* Image */}
      <Link
        to={item.slug ? `/product/${item.slug}` : '#'}
        className="shrink-0 w-20 h-24 sm:w-24 sm:h-28 bg-ivory-dark overflow-hidden block"
      >
        {item.imagePath && !imgError ? (
          <img
            src={item.imagePath}
            alt={item.name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-muted/30">
            <span className="font-serif text-lg">✦</span>
          </div>
        )}
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              to={item.slug ? `/product/${item.slug}` : '#'}
              className="font-serif text-sm italic text-text hover:text-burgundy transition-colors leading-snug"
            >
              {item.name}
            </Link>
            <p className="text-xs text-text-muted mt-1">
              {formatPrice(item.price)} each
            </p>
          </div>
          <button
            onClick={() => onRemove(item.productId)}
            className="shrink-0 text-text-muted hover:text-error transition-colors p-1 cursor-pointer"
            aria-label={`Remove ${item.name} from cart`}
          >
            <Trash2 size={14} />
          </button>
        </div>

        {!item.isAvailable && (
          <p className="text-xs text-error mt-1.5 bg-error/5 border border-error/10 px-2 py-1 inline-block">
            This product is no longer available
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          {/* Quantity controls */}
          <div className="flex items-center border border-border">
            <button
              onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="flex items-center justify-center h-8 w-8 text-text-muted hover:text-text disabled:text-border disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus size={14} />
            </button>
            <input
              type="number"
              min={1}
              max={99}
              value={item.quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 1 && val <= 99) {
                  onUpdateQuantity(item.productId, val);
                }
              }}
              className="h-8 w-10 text-center text-sm text-text border-x border-border outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              aria-label={`Quantity for ${item.name}`}
            />
            <button
              onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
              disabled={item.quantity >= 99}
              className="flex items-center justify-center h-8 w-8 text-text-muted hover:text-text disabled:text-border disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Line total */}
          <p className="text-sm font-medium text-text">
            {formatPrice(lineTotal)}
          </p>
        </div>
      </div>
    </div>
  );
}
