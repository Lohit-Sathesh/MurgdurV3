import type { Product } from './product';

export type CartItem = {
  productId: string;
  variantId: string;
  name: string;
  price: number;
  image: string;
  color?: string;
  size?: string;
  quantity: number;
  product?: Product;
};

export type CartState = {
  items: CartItem[];
  subtotal: number;
};
