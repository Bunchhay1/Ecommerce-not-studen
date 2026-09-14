export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
}

export interface ShippingAddress {
  id: string;
  fullName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

export interface ShippingTrackingEvent {
  status: string;
  description: string;
  location?: string;
  timestamp: string;
}

export interface ShippingTracking {
  trackingNumber: string;
  carrier: string;
  status: "PLACED" | "PAID" | "PROCESSING" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED";
  estimatedDelivery: string;
  events: ShippingTrackingEvent[];
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  totalAmount: number;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  createdAt: string;
  tracking?: ShippingTracking;
}
