import { supabase } from '../lib/supabase';
import type { Order, OrderItem } from '../types/database';
import type { CreateOrderRequest, CreateOrderResponse } from '../types/api';

/**
 * Create an order via Edge Function or direct RPC fallback.
 * Never sends prices from the frontend — the backend calculates totals.
 */
export async function createOrder(
  request: CreateOrderRequest
): Promise<{ data: CreateOrderResponse | null; error: string | null }> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(request),
    });

    if (response.ok) {
      const data: CreateOrderResponse = await response.json();
      return { data, error: null };
    }

    // If edge function not found (404), fall back to direct database RPC
    if (response.status === 404) {
      return await createOrderViaRpc(request);
    }

    const errorBody = await response.json().catch(() => ({}));
    return {
      data: null,
      error: errorBody.error || `Order creation failed (HTTP ${response.status})`,
    };
  } catch (err) {
    // Network or function call failure — try direct RPC fallback
    return await createOrderViaRpc(request);
  }
}

async function createOrderViaRpc(
  request: CreateOrderRequest
): Promise<{ data: CreateOrderResponse | null; error: string | null }> {
  const { data, error } = await supabase.rpc('create_order', {
    p_items: request.items,
    p_customer_note: request.customer_note || null,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as CreateOrderResponse, error: null };
}

/**
 * Fetch a single order by public token (public access).
 */
export async function getOrderByToken(
  publicToken: string
): Promise<{ order: Order | null; items: OrderItem[]; error: string | null }> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('public_token', publicToken)
    .maybeSingle();

  if (orderError || !order) {
    return { order: null, items: [], error: orderError?.message || 'Order not found' };
  }

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', order.id);

  if (itemsError) {
    return { order: order as Order, items: [], error: itemsError.message };
  }

  return { order: order as Order, items: (items as OrderItem[]) ?? [], error: null };
}

/**
 * Fetch all orders (admin only) with pagination.
 */
export async function getOrders({
  status = '',
  search = '',
  page = 1,
  pageSize = 25,
}: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ data: Order[]; count: number; error: string | null }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' });

  if (status) {
    query = query.eq('status', status);
  }

  if (search.trim()) {
    query = query.ilike('order_code', `%${search.trim()}%`);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  return { data: (data as Order[]) ?? [], count: count ?? 0, error: null };
}

/**
 * Update order status (admin only).
 */
export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) return { error: error.message };
  return { error: null };
}
