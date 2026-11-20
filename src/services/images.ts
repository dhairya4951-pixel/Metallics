import { supabase } from '../lib/supabase';

const BUCKET = 'product-images';

/**
 * Image path convention: products/{product_id}/{filename}
 */
export function getImageStoragePath(productId: string, filename: string): string {
  // Sanitise filename
  const clean = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `products/${productId}/${Date.now()}_${clean}`;
}

/**
 * Get the full public URL for a storage path.
 */
export function getPublicImageUrl(storagePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Upload an image file to Supabase Storage.
 * Returns the storage path on success.
 */
export async function uploadImage(
  productId: string,
  file: File
): Promise<{ path: string; error: string | null }> {
  const path = getImageStoragePath(productId, file.name);

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    return { path: '', error: error.message };
  }

  return { path, error: null };
}

/**
 * Delete an image from Supabase Storage.
 */
export async function deleteImage(
  storagePath: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Delete multiple images from Supabase Storage.
 */
export async function deleteImages(
  storagePaths: string[]
): Promise<{ error: string | null }> {
  if (storagePaths.length === 0) return { error: null };

  const { error } = await supabase.storage.from(BUCKET).remove(storagePaths);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
