// supabase/functions/create-order/index.ts
// ─────────────────────────────────────────
// Supabase Edge Function for secure order creation.
// Uses the service-role key (server-side only) to call
// the create_order() database function transactionally.
// ─────────────────────────────────────────

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-idempotency-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface OrderItem {
  product_id: string;
  quantity: number;
}

interface RequestBody {
  items: OrderItem[];
  customer_note?: string;
  currency_code?: string;
  idempotency_key?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Rate limiting: check content length
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 10_000) {
      return new Response(
        JSON.stringify({ error: "Request too large" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse body
    const body: RequestBody = await req.json();

    // ── Validate request structure ──────────────────────
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Order must contain at least one item" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.items.length > 50) {
      return new Response(
        JSON.stringify({ error: "Order cannot contain more than 50 distinct items" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate each item
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    for (const item of body.items) {
      if (!item.product_id || !uuidRegex.test(item.product_id)) {
        return new Response(
          JSON.stringify({ error: `Invalid product_id: ${item.product_id}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!item.quantity || typeof item.quantity !== "number" || item.quantity < 1 || item.quantity > 100) {
        return new Response(
          JSON.stringify({ error: `Invalid quantity for product ${item.product_id}: must be 1-100` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validate customer note
    if (body.customer_note && body.customer_note.length > 500) {
      return new Response(
        JSON.stringify({ error: "Customer note cannot exceed 500 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Idempotency check ───────────────────────────────
    const idempotencyKey = body.idempotency_key || req.headers.get("x-idempotency-key");

    if (idempotencyKey) {
      const supabaseCheck = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
      const { data: existingOrder } = await supabaseCheck
        .from("orders")
        .select("order_code, public_token, total_items, subtotal, currency_code")
        .eq("order_code", idempotencyKey)
        .maybeSingle();

      if (existingOrder) {
        return new Response(
          JSON.stringify(existingOrder),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Call the database function ──────────────────────
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data, error } = await supabase.rpc("create_order", {
      p_items: body.items,
      p_customer_note: body.customer_note || null,
      p_currency_code: body.currency_code || "INR",
    });

    if (error) {
      console.error("create_order error:", error);

      // Map database errors to user-friendly messages
      const message = error.message || "Failed to create order";
      const status = message.includes("not available") ? 409 : 500;

      return new Response(
        JSON.stringify({ error: message }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(data),
      {
        status: 201,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
