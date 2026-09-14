export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
  attributes?: Record<string, string>;
  maxStock: number;
}

export interface CartSummary {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode?: string;
}
