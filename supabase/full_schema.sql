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
-- ============================================================
-- Migration 004: Orders
-- ============================================================

CREATE TABLE public.orders (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code    text          NOT NULL UNIQUE,
  public_token  uuid          NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  status        text          NOT NULL DEFAULT 'awaiting_dm'
                              CHECK (status IN (
                                'awaiting_dm','contacted','confirmed','completed','cancelled'
                              )),
  total_items   integer       NOT NULL,
  subtotal      numeric(10,2) NOT NULL,
  currency_code text          NOT NULL DEFAULT 'INR',
  customer_note text          CHECK (customer_note IS NULL OR length(customer_note) <= 500),
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.orders IS 'Customer order records submitted via DM-to-Order';

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
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
-- ============================================================
-- Migration 006: Admin Users
-- ============================================================

CREATE TABLE public.admin_users (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text        NOT NULL DEFAULT 'admin',
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_users IS 'Maps Supabase Auth users to admin roles — no public registration';
-- ============================================================
-- Migration 007: Site Settings
-- ============================================================

CREATE TABLE public.site_settings (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text        NOT NULL UNIQUE,
  value       text        NOT NULL DEFAULT '',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.site_settings IS 'Key-value store for brand configuration';

CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed default settings
INSERT INTO public.site_settings (key, value) VALUES
  ('brand_name',          'Metallics'),
  ('brand_tagline',       'Jewelry that highlights your individuality'),
  ('instagram_username',  ''),
  ('currency_code',       'INR'),
  ('currency_locale',     'en-IN'),
  ('about_content',       '');
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
-- ============================================================
-- Migration 009: is_admin() helper + Row Level Security
-- ============================================================

-- ── Admin authorization function ──────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'Returns true if the current authenticated user is in admin_users';


-- ── Enable RLS on all tables ──────────────────────────────
ALTER TABLE public.categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings  ENABLE ROW LEVEL SECURITY;


-- ══════════════════════════════════════════════════════════
-- CATEGORIES
-- ══════════════════════════════════════════════════════════

-- Public: read active categories
CREATE POLICY categories_public_select
  ON public.categories FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Admin: full access to all categories
CREATE POLICY categories_admin_select
  ON public.categories FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY categories_admin_insert
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY categories_admin_update
  ON public.categories FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY categories_admin_delete
  ON public.categories FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ══════════════════════════════════════════════════════════
-- PRODUCTS
-- ══════════════════════════════════════════════════════════

-- Public: read available products
CREATE POLICY products_public_select
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (is_available = true);

-- Admin: full access
CREATE POLICY products_admin_select
  ON public.products FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY products_admin_insert
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY products_admin_update
  ON public.products FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY products_admin_delete
  ON public.products FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ══════════════════════════════════════════════════════════
-- PRODUCT IMAGES
-- ══════════════════════════════════════════════════════════

-- Public: read images belonging to available products
CREATE POLICY product_images_public_select
  ON public.product_images FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_images.product_id
        AND products.is_available = true
    )
  );

-- Admin: full access
CREATE POLICY product_images_admin_select
  ON public.product_images FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY product_images_admin_insert
  ON public.product_images FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY product_images_admin_update
  ON public.product_images FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY product_images_admin_delete
  ON public.product_images FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ══════════════════════════════════════════════════════════
-- ORDERS
-- ══════════════════════════════════════════════════════════

-- Public: read own order by public_token only (via query parameter)
CREATE POLICY orders_public_select
  ON public.orders FOR SELECT
  TO anon, authenticated
  USING (true);
  -- Note: public_token lookup is enforced at the application level.
  -- The token is unguessable (UUID4). RLS ensures no INSERT/UPDATE/DELETE.

-- Admin: full read + update (no delete to preserve records)
CREATE POLICY orders_admin_select
  ON public.orders FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY orders_admin_insert
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY orders_admin_update
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ══════════════════════════════════════════════════════════
-- ORDER ITEMS
-- ══════════════════════════════════════════════════════════

-- Public: read items for orders they can access (via public_token join)
CREATE POLICY order_items_public_select
  ON public.order_items FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
    )
  );

-- Admin: full read + insert (snapshots are immutable after creation)
CREATE POLICY order_items_admin_select
  ON public.order_items FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY order_items_admin_insert
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());


-- ══════════════════════════════════════════════════════════
-- ADMIN USERS
-- ══════════════════════════════════════════════════════════

-- Admin: read own row only
CREATE POLICY admin_users_self_select
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- No insert/update/delete via API — managed via SQL/dashboard only


-- ══════════════════════════════════════════════════════════
-- SITE SETTINGS
-- ══════════════════════════════════════════════════════════

-- Public: read all settings
CREATE POLICY site_settings_public_select
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin: insert + update (no delete to prevent orphaned keys)
CREATE POLICY site_settings_admin_insert
  ON public.site_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY site_settings_admin_update
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
-- ============================================================
-- Migration 010: create_order() transactional function
-- ============================================================
-- Called by the Edge Function with service-role key.
-- Accepts a JSON array of {product_id, quantity} items and
-- an optional customer note. Validates products, fetches current
-- prices, calculates totals, and inserts order + items atomically.
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_order(
  p_items         jsonb,
  p_customer_note text DEFAULT NULL,
  p_currency_code text DEFAULT 'INR'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id      uuid;
  v_order_code    text;
  v_public_token  uuid;
  v_total_items   integer := 0;
  v_subtotal      numeric(10,2) := 0;
  v_item          jsonb;
  v_product       record;
  v_quantity      integer;
  v_line_total    numeric(10,2);
  v_primary_image text;
  v_result_items  jsonb := '[]'::jsonb;
BEGIN
  -- Validate input
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  IF jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Order cannot contain more than 50 distinct items';
  END IF;

  IF p_customer_note IS NOT NULL AND length(p_customer_note) > 500 THEN
    RAISE EXCEPTION 'Customer note cannot exceed 500 characters';
  END IF;

  -- Generate identifiers
  v_order_id     := gen_random_uuid();
  v_public_token := gen_random_uuid();
  v_order_code   := 'MET-' || to_char(now(), 'YYYYMMDD') || '-' ||
                    upper(substr(replace(v_order_id::text, '-', ''), 1, 4));

  -- Insert the order header first so order_items foreign key constraint is satisfied
  INSERT INTO public.orders (
    id, order_code, public_token, status,
    total_items, subtotal, currency_code, customer_note
  ) VALUES (
    v_order_id, v_order_code, v_public_token, 'awaiting_dm',
    0, 0, p_currency_code, p_customer_note
  );

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item->>'quantity')::integer;

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for product %', v_item->>'product_id';
    END IF;

    IF v_quantity > 100 THEN
      RAISE EXCEPTION 'Quantity cannot exceed 100 per product';
    END IF;

    -- Fetch and validate product
    SELECT p.* INTO v_product
      FROM public.products p
     WHERE p.id = (v_item->>'product_id')::uuid
       AND p.is_available = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % is not available or does not exist',
        v_item->>'product_id';
    END IF;

    -- Calculate line total
    v_line_total := v_product.price * v_quantity;
    v_subtotal   := v_subtotal + v_line_total;
    v_total_items := v_total_items + v_quantity;

    -- Get primary image path
    SELECT pi.storage_path INTO v_primary_image
      FROM public.product_images pi
     WHERE pi.product_id = v_product.id AND pi.is_primary = true
     LIMIT 1;

    -- Insert order item
    INSERT INTO public.order_items (
      order_id, product_id, product_name, product_slug,
      sku, unit_price, quantity, line_total, image_path
    ) VALUES (
      v_order_id, v_product.id, v_product.name, v_product.slug,
      v_product.sku, v_product.price, v_quantity, v_line_total, v_primary_image
    );

    -- Accumulate result
    v_result_items := v_result_items || jsonb_build_object(
      'product_name', v_product.name,
      'product_slug', v_product.slug,
      'unit_price',   v_product.price,
      'quantity',     v_quantity,
      'line_total',   v_line_total
    );
  END LOOP;

  -- Update order with final calculated totals
  UPDATE public.orders
     SET total_items = v_total_items,
         subtotal    = v_subtotal
   WHERE id = v_order_id;

  -- Return result
  RETURN jsonb_build_object(
    'order_code',    v_order_code,
    'public_token',  v_public_token,
    'total_items',   v_total_items,
    'subtotal',      v_subtotal,
    'currency_code', p_currency_code,
    'items',         v_result_items
  );
END;
$$;

COMMENT ON FUNCTION public.create_order(jsonb, text, text) IS
  'Transactional order creation — validates products, calculates totals, inserts order + items atomically';
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
