import { supabase } from '../lib/supabase';
import { PAGE_SIZE } from '../lib/constants';
import type { Product } from '../types/database';
import type { PaginatedResponse, SortOption } from '../types/api';

interface GetProductsParams {
  categorySlug?: string | null;
  search?: string;
  sort?: SortOption;
  page?: number;
  minPrice?: number | null;
  maxPrice?: number | null;
}

/**
 * Fetch paginated products with optional filtering and sorting.
 * Uses Supabase range() for server-side pagination.
 */
export async function getProducts({
  categorySlug = null,
  search = '',
  sort = 'recommended',
  page = 1,
  minPrice = null,
  maxPrice = null,
}: GetProductsParams = {}): Promise<PaginatedResponse<Product>> {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Build base query — use inner join when filtering by category
  let query;
  if (categorySlug) {
    query = supabase
      .from('products')
      .select(`
        *,
        category:categories!inner(id, name, slug),
        images:product_images(id, storage_path, alt_text, display_order, is_primary)
      `, { count: 'exact' })
      .eq('is_available', true)
      .eq('category.slug', categorySlug);
  } else {
    query = supabase
      .from('products')
      .select(`
        *,
        category:categories!category_id(id, name, slug),
        images:product_images(id, storage_path, alt_text, display_order, is_primary)
      `, { count: 'exact' })
      .eq('is_available', true);
  }

  // Search — matches name, description, or SKU
  if (search.trim()) {
    const term = search.trim();
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%,sku.ilike.%${term}%`);
  }

  // Price range
  if (minPrice !== null && minPrice > 0) {
    query = query.gte('price', minPrice);
  }
  if (maxPrice !== null && maxPrice > 0) {
    query = query.lte('price', maxPrice);
  }

  // Sorting
  switch (sort) {
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'name_asc':
      query = query.order('name', { ascending: true });
      break;
    case 'recommended':
    default:
      query = query
        .order('is_featured', { ascending: false })
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      break;
  }

  // Paginate
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to fetch products:', error.message);
    throw new Error(error.message);
  }

  const totalCount = count ?? 0;

  return {
    data: (data as Product[]) ?? [],
    count: totalCount,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(totalCount / PAGE_SIZE),
  };
}

/**
 * Fetch a single product by slug, including all images.
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories!category_id(id, name, slug),
      images:product_images(id, storage_path, alt_text, display_order, is_primary)
    `)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch product:', error.message);
    throw new Error(error.message);
  }

  return data as Product | null;
}

/**
 * Fetch all products (admin — includes unavailable).
 */
export async function getAllProducts({
  search = '',
  categoryId = '',
  isAvailable,
  page = 1,
}: { search?: string; categoryId?: string; isAvailable?: boolean | null; page?: number } = {}): Promise<PaginatedResponse<Product>> {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories!category_id(id, name, slug),
      images:product_images(id, storage_path, alt_text, display_order, is_primary)
    `, { count: 'exact' });

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (isAvailable !== undefined && isAvailable !== null) {
    query = query.eq('is_available', isAvailable);
  }

  if (search.trim()) {
    query = query.or(`name.ilike.%${search.trim()}%,sku.ilike.%${search.trim()}%`);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to fetch products (admin):', error.message);
    return { data: [], count: 0, page, pageSize: PAGE_SIZE, totalPages: 0 };
  }

  return {
    data: (data as Product[]) ?? [],
    count: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  };
}
