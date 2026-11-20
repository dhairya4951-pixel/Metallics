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
