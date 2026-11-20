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
