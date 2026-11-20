import { supabase } from '../lib/supabase';
import type { Category } from '../types/database';

let cachedCategories: Category[] | null = null;

/**
 * Fetch active categories, with simple in-memory caching.
 */
export async function getCategories(forceRefresh = false): Promise<Category[]> {
  if (cachedCategories && !forceRefresh) {
    return cachedCategories;
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Failed to load categories:', error.message);
    return cachedCategories ?? [];
  }

  cachedCategories = data ?? [];
  return cachedCategories;
}

/**
 * Invalidate the category cache (after admin changes).
 */
export function invalidateCategoryCache(): void {
  cachedCategories = null;
}

/**
 * Fetch all categories including inactive (admin only).
 */
export async function getAllCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Failed to load all categories:', error.message);
    return [];
  }

  return data ?? [];
}
