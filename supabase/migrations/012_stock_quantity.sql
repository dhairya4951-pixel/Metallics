-- ============================================================
-- Migration 012: Add stock_quantity to products
-- ============================================================

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 1 CHECK (stock_quantity >= 0);

COMMENT ON COLUMN public.products.stock_quantity IS 'Available inventory stock quantity for this product';
