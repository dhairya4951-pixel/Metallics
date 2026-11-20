import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { Plus, Search, Archive, ArchiveRestore } from 'lucide-react';
import { getAllProducts } from '../../services/products';
import { getAllCategories } from '../../services/categories';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/utils';
import { getPublicImageUrl } from '../../services/images';
import { useDebounce } from '../../hooks/useDebounce';
import type { Product, Category } from '../../types/database';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import CsvImport from '../../components/admin/CsvImport';
import CsvExport from '../../components/admin/CsvExport';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'' | 'available' | 'archived'>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();
  const debouncedSearch = useDebounce(search, 300);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const isAvailable =
      availabilityFilter === 'available' ? true :
      availabilityFilter === 'archived' ? false :
      null;
    const result = await getAllProducts({
      search: debouncedSearch,
      categoryId: categoryFilter,
      isAvailable,
      page,
    });
    setProducts(result.data);
    setTotalPages(result.totalPages);
    setTotalCount(result.count);
    setLoading(false);
  }, [debouncedSearch, categoryFilter, availabilityFilter, page]);

  const fetchCategories = useCallback(async () => {
    const cats = await getAllCategories();
    setCategories(cats);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryFilter, availabilityFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleToggleAvailability = async (product: Product) => {
    const newState = !product.is_available;
    const { error } = await supabase
      .from('products')
      .update({ is_available: newState })
      .eq('id', product.id);

    if (error) {
      alert(`Failed to update: ${error.message}`);
      return;
    }
    fetchProducts();
  };

  const getPrimaryImage = (product: Product): string | null => {
    if (!product.images || product.images.length === 0) return null;
    const primary = product.images.find(i => i.is_primary);
    const img = primary || product.images[0];
    return getPublicImageUrl(img.storage_path);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl text-text">Products</h1>
          <p className="text-sm text-text-muted mt-1">
            {totalCount} product{totalCount !== 1 ? 's' : ''} in catalogue
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CsvImport categories={categories} onComplete={fetchProducts} />
          <CsvExport />
          <Link to="/admin/products/new">
            <Button size="sm">
              <Plus size={14} />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU…"
            className="w-full border border-border bg-white pl-9 pr-4 py-2 text-sm text-text placeholder:text-text-muted focus:border-burgundy focus:outline-none transition-colors"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-border bg-white px-3 py-2 text-sm text-text focus:border-burgundy focus:outline-none appearance-none"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={availabilityFilter}
          onChange={(e) => setAvailabilityFilter(e.target.value as '' | 'available' | 'archived')}
          className="border border-border bg-white px-3 py-2 text-sm text-text focus:border-burgundy focus:outline-none appearance-none"
        >
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products found"
          message={search || categoryFilter || availabilityFilter
            ? 'No products match your current filters. Try adjusting your search.'
            : 'Your catalogue is empty. Add your first product to get started.'}
        />
      ) : (
        <>
          <div className="border border-border bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-ivory">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted hidden sm:table-cell">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted hidden md:table-cell">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => {
                  const imgUrl = getPrimaryImage(product);
                  return (
                  <tr
                    key={product.id}
                    className="border-b border-border-light last:border-0 hover:bg-ivory/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-ivory border border-border shrink-0 overflow-hidden">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-text-muted text-[10px]">
                              No img
                            </div>
                          )}
                        </div>
                        <div>
                          <button
                            onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                            className="font-medium text-text hover:text-burgundy transition-colors text-left cursor-pointer"
                          >
                            {product.name}
                          </button>
                          {product.is_featured && (
                            <Badge variant="primary" className="ml-2 text-[10px]">Featured</Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-muted hidden sm:table-cell">
                      {product.category?.name || '—'}
                    </td>
                    <td className="px-4 py-3">{formatPrice(product.price)}</td>
                    <td className="px-4 py-3 text-text-muted hidden md:table-cell">
                      {product.sku || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={product.is_available ? 'success' : 'default'}>
                        {product.is_available ? 'Available' : 'Archived'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/products/${product.id}/edit`}
                          className="text-xs text-burgundy hover:underline"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleToggleAvailability(product)}
                          className="text-text-muted hover:text-text p-1 cursor-pointer"
                          title={product.is_available ? 'Archive' : 'Restore'}
                        >
                          {product.is_available ? <Archive size={14} /> : <ArchiveRestore size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-text-muted">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
