-- ============================================================
-- Migration 001: Categories
-- ============================================================

CREATE TABLE public.categories (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  slug        text        NOT NULL UNIQUE,
  sort_order  integer     NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.categories IS 'Product categories (Earrings, Necklace, Bracelet, Ring)';

-- Seed the four base categories
INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Earrings',  'earrings',  1),
  ('Necklace',  'necklace',  2),
  ('Bracelet',  'bracelet',  3),
  ('Ring',      'ring',      4);
