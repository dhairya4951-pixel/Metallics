-- ============================================================
-- Migration 008: Indexes
-- ============================================================

-- Products
CREATE INDEX idx_products_category_available
  ON public.products (category_id, is_available);

CREATE INDEX idx_products_featured
  ON public.products (is_featured)
  WHERE is_featured = true;

CREATE INDEX idx_products_created_at
  ON public.products (created_at DESC);

CREATE INDEX idx_products_sort_order
  ON public.products (sort_order, name);

-- Product Images
CREATE INDEX idx_product_images_product
  ON public.product_images (product_id, display_order);

-- Orders
CREATE INDEX idx_orders_public_token
  ON public.orders (public_token);

CREATE INDEX idx_orders_order_code
  ON public.orders (order_code);

CREATE INDEX idx_orders_status
  ON public.orders (status);

CREATE INDEX idx_orders_created_at
  ON public.orders (created_at DESC);

-- Order Items
CREATE INDEX idx_order_items_order
  ON public.order_items (order_id);
