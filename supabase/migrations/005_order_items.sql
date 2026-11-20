-- ============================================================
-- Migration 005: Order Items
-- ============================================================

CREATE TABLE public.order_items (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid          NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id    uuid          REFERENCES public.products(id) ON DELETE SET NULL,
  product_name  text          NOT NULL,
  product_slug  text          NOT NULL,
  sku           text,
  unit_price    numeric(10,2) NOT NULL,
  quantity      integer       NOT NULL CHECK (quantity > 0),
  line_total    numeric(10,2) NOT NULL,
  image_path    text
);

COMMENT ON TABLE public.order_items IS 'Snapshot of products at order time — prices are frozen';
