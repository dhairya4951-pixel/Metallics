import { Minus, Plus } from 'lucide-react';

interface QuantityControlProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
}

export default function QuantityControl({
  quantity,
  onChange,
  min = 1,
  max = 99,
}: QuantityControlProps) {
  return (
    <div className="flex items-center border border-border">
      <button
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={quantity <= min}
        className="flex items-center justify-center h-9 w-9 text-text-muted hover:text-text disabled:text-border disabled:cursor-not-allowed transition-colors"
        aria-label="Decrease quantity"
      >
        <Minus size={14} />
      </button>
      <span className="flex items-center justify-center h-9 w-10 text-sm text-text border-x border-border select-none">
        {quantity}
      </span>
      <button
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
        className="flex items-center justify-center h-9 w-9 text-text-muted hover:text-text disabled:text-border disabled:cursor-not-allowed transition-colors"
        aria-label="Increase quantity"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
