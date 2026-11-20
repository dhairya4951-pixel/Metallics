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
