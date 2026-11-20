export interface CreateOrderRequest {
  items: { product_id: string; quantity: number }[];
  customer_note?: string;
}

export interface CreateOrderResponse {
  order_code: string;
  public_token: string;
  total_items: number;
  subtotal: number;
  currency_code: string;
  items: {
    product_name: string;
    product_slug: string;
    unit_price: number;
    quantity: number;
    line_total: number;
  }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type SortOption =
  | 'recommended'
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'name_asc';
