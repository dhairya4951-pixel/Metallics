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
