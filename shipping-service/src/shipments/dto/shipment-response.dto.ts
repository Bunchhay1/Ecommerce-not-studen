export interface ShipmentResponseDto {
  id: string;
  shipmentNumber: string;
  orderId: string;
  userId: string;
  status: string;
  shippingMethod: string;
  carrier: string;
  trackingNumber: string;
  shippingFee: number;
  currency: string;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  address?: any;
  items?: any[];
  trackingEvents?: any[];
}
