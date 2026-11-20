-- ============================================================
-- Migration 002: Products
-- ============================================================

-- Auto-update updated_at trigger function (reusable)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE public.products (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text          NOT NULL,
  slug          text          NOT NULL UNIQUE,
  sku           text          UNIQUE,
  category_id   uuid          NOT NULL REFERENCES public.categories(id),
  description   text          NOT NULL DEFAULT '',
  price         numeric(10,2) NOT NULL CHECK (price > 0),
  is_available  boolean       NOT NULL DEFAULT true,
  is_featured   boolean       NOT NULL DEFAULT false,
  sort_order    integer       NOT NULL DEFAULT 0,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.products IS 'Jewellery product catalogue';

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
