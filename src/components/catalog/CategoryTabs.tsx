import { cn } from '../../lib/utils';

interface CategoryTabsProps {
  categories: { slug: string; name: string }[];
  activeSlug: string | null;
  onChange: (slug: string | null) => void;
}

export default function CategoryTabs({ categories, activeSlug, onChange }: CategoryTabsProps) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide" role="tablist" aria-label="Product categories">
      <button
        role="tab"
        aria-selected={activeSlug === null}
        onClick={() => onChange(null)}
        className={cn(
          'shrink-0 px-6 py-2.5 text-sm tracking-wide border transition-colors duration-200',
          activeSlug === null
            ? 'bg-burgundy text-white border-burgundy'
            : 'bg-transparent text-text-muted border-border hover:border-text-muted hover:text-text'
        )}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.slug}
          role="tab"
          aria-selected={activeSlug === cat.slug}
          onClick={() => onChange(cat.slug)}
          className={cn(
            'shrink-0 px-6 py-2.5 text-sm tracking-wide border transition-colors duration-200',
            activeSlug === cat.slug
              ? 'bg-burgundy text-white border-burgundy'
              : 'bg-transparent text-text-muted border-border hover:border-text-muted hover:text-text'
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
