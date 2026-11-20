import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { getProducts } from '../../services/products';
import { getCategories } from '../../services/categories';
import { useDebounce } from '../../hooks/useDebounce';
import { useCart } from '../../contexts/CartContext';
import { DEFAULT_SETTINGS } from '../../lib/constants';
import type { Product, Category } from '../../types/database';
import type { SortOption } from '../../types/api';
import CategoryTabs from '../../components/catalog/CategoryTabs';
import SearchBar from '../../components/catalog/SearchBar';
import SortDropdown from '../../components/catalog/SortDropdown';
import FilterDropdown from '../../components/catalog/FilterDropdown';
import ProductGrid from '../../components/catalog/ProductGrid';
import Pagination from '../../components/catalog/Pagination';
import { CatalogSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Button from '../../components/ui/Button';

interface PriceFilter {
  minPrice: string;
  maxPrice: string;
}

export default function CatalogPage() {
  const [searchParams] = useSearchParams();

  // Filter / sort state
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState<SortOption>('recommended');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>({ minPrice: '', maxPrice: '' });
  const [currentPage, setCurrentPage] = useState(1);

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { addItem } = useCart();

  // Fetch categories once
  useEffect(() => {
    getCategories().then(setCategories).catch(() => {/* ignore */});
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, debouncedSearch, sort, priceFilter]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getProducts({
        categorySlug: activeCategory,
        search: debouncedSearch,
        sort,
        page: currentPage,
        minPrice: priceFilter.minPrice ? parseFloat(priceFilter.minPrice) : null,
        maxPrice: priceFilter.maxPrice ? parseFloat(priceFilter.maxPrice) : null,
      });

      setProducts(result.data);
      setTotalPages(result.totalPages);
      setTotalCount(result.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]);
      setTotalPages(0);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, debouncedSearch, sort, currentPage, priceFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCategoryChange = (slug: string | null) => {
    setActiveCategory(slug);
  };

  const handleSortChange = (value: SortOption) => {
    setSort(value);
  };

  const handleAddToCart = (productId: string) => {
    addItem(productId);
  };

  const hasActiveFilters = debouncedSearch || activeCategory || priceFilter.minPrice || priceFilter.maxPrice;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Page title */}
      <div className="text-center mb-8">
        <h1 className="font-serif text-2xl md:text-3xl uppercase tracking-wider text-text">
          Catalog
        </h1>
      </div>

      {/* Category tabs */}
      <div className="flex justify-center mb-8">
        <CategoryTabs
          categories={categories.map(c => ({ slug: c.slug, name: c.name }))}
          activeSlug={activeCategory}
          onChange={handleCategoryChange}
        />
      </div>

      {/* Filter bar: Filter left, Sort right */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <FilterDropdown value={priceFilter} onChange={setPriceFilter} />
        <SortDropdown value={sort} onChange={handleSortChange} />
      </div>

      {/* Search bar */}
      <div className="max-w-md mb-8">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {/* Results count */}
      {!loading && !error && totalCount > 0 && (
        <p className="text-xs text-text-muted mb-6">
          {totalCount} product{totalCount !== 1 ? 's' : ''} found
          {activeCategory && ` in ${categories.find(c => c.slug === activeCategory)?.name || activeCategory}`}
          {debouncedSearch && ` matching "${debouncedSearch}"`}
        </p>
      )}

      {/* Content */}
      {loading ? (
        <CatalogSkeleton count={8} />
      ) : error ? (
        <ErrorState
          title="Failed to load catalogue"
          message={error}
          onRetry={fetchProducts}
        />
      ) : products.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="No products found"
            message="Try adjusting your search, category or price filters."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setActiveCategory(null);
                  setPriceFilter({ minPrice: '', maxPrice: '' });
                  setSort('recommended');
                }}
              >
                Clear All Filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="Catalogue is empty"
            message="Products will appear here once they are added through the admin panel."
          />
        )
      ) : (
        <ProductGrid
          products={products}
          onAddToCart={handleAddToCart}
          tagline={DEFAULT_SETTINGS.brand_tagline}
        />
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* View More button (like reference) */}
      {!loading && totalPages > 1 && currentPage < totalPages && (
        <div className="text-center mt-2 mb-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => p + 1)}
          >
            View more
          </Button>
        </div>
      )}
    </div>
  );
}
