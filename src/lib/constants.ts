export const PAGE_SIZE = 25;

export const ORDER_STATUSES = [
  'awaiting_dm',
  'contacted',
  'confirmed',
  'completed',
  'cancelled',
] as const;

export const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' },
] as const;

export const DEFAULT_SETTINGS = {
  brand_name: 'Metallics',
  brand_tagline: 'Jewelry that highlights your individuality',
  instagram_username: '',
  currency_code: 'INR',
  currency_locale: 'en-IN',
  about_content: '',
};
