import { SORT_OPTIONS } from '../../lib/constants';
import type { SortOption } from '../../types/api';

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="appearance-none bg-transparent text-sm text-text-muted cursor-pointer border-none outline-none font-sans pr-1"
        aria-label="Sort products"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span className="text-text-muted text-xs">▾</span>
    </div>
  );
}
