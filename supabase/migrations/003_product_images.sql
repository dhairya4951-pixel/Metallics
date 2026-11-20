-- ============================================================
-- Migration 003: Product Images
-- ============================================================

CREATE TABLE public.product_images (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  storage_path  text        NOT NULL,
  alt_text      text        NOT NULL DEFAULT '',
  display_order integer     NOT NULL DEFAULT 0,
  is_primary    boolean     NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.product_images IS 'Multiple photographs per product';

-- Partial unique index: at most one primary image per product
CREATE UNIQUE INDEX idx_product_images_one_primary
  ON public.product_images (product_id)
  WHERE is_primary = true;
