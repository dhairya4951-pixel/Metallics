export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CartProduct {
  productId: string;
  quantity: number;
  name: string;
  slug: string;
  price: number;
  imagePath: string | null;
  isAvailable: boolean;
}
