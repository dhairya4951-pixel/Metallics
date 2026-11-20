// ─── Category ───
export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// ─── Product Image ───
export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

// ─── Product ───
export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  category_id: string;
  description: string;
  price: number;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  images?: ProductImage[];
}

// ─── Order ───
export type OrderStatus = 'awaiting_dm' | 'contacted' | 'confirmed' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  order_code: string;
  public_token: string;
  status: OrderStatus;
  total_items: number;
  subtotal: number;
  currency_code: string;
  customer_note: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_slug: string;
  sku: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  image_path: string | null;
}

// ─── Site Settings ───
export interface SiteSettings {
  brand_name: string;
  brand_tagline: string;
  instagram_username: string;
  currency_code: string;
  currency_locale: string;
  about_content: string;
  logo_path?: string;
}

// ─── Admin User ───
export interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}
