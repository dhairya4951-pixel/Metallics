import { supabase } from '../lib/supabase';
import type { SiteSettings } from '../types/database';
import { DEFAULT_SETTINGS } from '../lib/constants';

/**
 * Fetch all site settings and return as a typed object.
 */
export async function getSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value');

  if (error || !data) {
    console.warn('Failed to load site settings, using defaults:', error?.message);
    return { ...DEFAULT_SETTINGS };
  }

  const map: Record<string, string> = {};
  for (const row of data) {
    map[row.key] = row.value;
  }

  return {
    brand_name: map.brand_name ?? DEFAULT_SETTINGS.brand_name,
    brand_tagline: map.brand_tagline ?? DEFAULT_SETTINGS.brand_tagline,
    instagram_username: map.instagram_username ?? DEFAULT_SETTINGS.instagram_username,
    currency_code: map.currency_code ?? DEFAULT_SETTINGS.currency_code,
    currency_locale: map.currency_locale ?? DEFAULT_SETTINGS.currency_locale,
    about_content: map.about_content ?? DEFAULT_SETTINGS.about_content,
    logo_path: map.logo_path,
  };
}

/**
 * Update a single site setting (admin only).
 */
export async function updateSetting(
  key: string,
  value: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('site_settings')
    .update({ value })
    .eq('key', key);

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Update multiple site settings at once (admin only).
 */
export async function updateSettings(
  settings: Partial<SiteSettings>
): Promise<{ error: string | null }> {
  const entries = Object.entries(settings).filter(([, v]) => v !== undefined);

  for (const [key, value] of entries) {
    const { error } = await supabase
      .from('site_settings')
      .update({ value: String(value) })
      .eq('key', key);

    if (error) return { error: `Failed to update ${key}: ${error.message}` };
  }

  return { error: null };
}
