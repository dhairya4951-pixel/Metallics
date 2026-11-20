-- ============================================================
-- Migration 011: Storage bucket + policies
-- ============================================================
-- NOTE: Supabase Storage bucket creation is typically done
-- via Dashboard or CLI, not via SQL migration. This file
-- documents the required policies. The INSERT INTO
-- storage.buckets will work when run as a migration via
-- the Supabase CLI or SQL Editor with appropriate permissions.
-- ============================================================

-- Create the product-images bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS Policies ──────────────────────────────────

-- Public: anyone can read/download images
CREATE POLICY storage_product_images_public_select
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');

-- Admin: upload images
CREATE POLICY storage_product_images_admin_insert
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

-- Admin: update images
CREATE POLICY storage_product_images_admin_update
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

-- Admin: delete images
CREATE POLICY storage_product_images_admin_delete
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  );
