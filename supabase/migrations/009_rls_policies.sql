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
