import { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import Button from '../ui/Button';

interface PriceFilter {
  minPrice: string;
  maxPrice: string;
}

interface FilterDropdownProps {
  value: PriceFilter;
  onChange: (value: PriceFilter) => void;
}

export default function FilterDropdown({ value, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<PriceFilter>(value);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Sync local state when value changes externally
  useEffect(() => {
    setLocal(value);
  }, [value]);

  const hasFilter = value.minPrice || value.maxPrice;

  const handleApply = () => {
    onChange(local);
    setOpen(false);
  };

  const handleClear = () => {
    const cleared = { minPrice: '', maxPrice: '' };
    setLocal(cleared);
    onChange(cleared);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 text-sm transition-colors cursor-pointer ${
          hasFilter ? 'text-burgundy font-medium' : 'text-text-muted hover:text-text'
        }`}
      >
        <SlidersHorizontal size={14} />
        Filter
        <span className="text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-20 w-64 bg-white border border-border shadow-sm p-4 space-y-4">
          <p className="text-xs font-medium text-text uppercase tracking-wider">Price Range</p>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-text-muted block mb-1">Min</label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={local.minPrice}
                onChange={(e) => setLocal(prev => ({ ...prev, minPrice: e.target.value }))}
                className="w-full border border-border bg-white px-2.5 py-1.5 text-sm text-text placeholder:text-text-muted focus:border-burgundy focus:outline-none transition-colors"
              />
            </div>
            <div className="flex items-end pb-2 text-text-muted text-xs">—</div>
            <div className="flex-1">
              <label className="text-[10px] text-text-muted block mb-1">Max</label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Any"
                value={local.maxPrice}
                onChange={(e) => setLocal(prev => ({ ...prev, maxPrice: e.target.value }))}
                className="w-full border border-border bg-white px-2.5 py-1.5 text-sm text-text placeholder:text-text-muted focus:border-burgundy focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleApply}>Apply</Button>
            {hasFilter && (
              <Button size="sm" variant="ghost" onClick={handleClear}>Clear</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
