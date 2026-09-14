export interface CreateCarrierShipmentRequest {
  shipmentNumber: string;
  orderId: string;
  shippingMethod: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  city: string;
  country: string;
  postalCode: string;
  itemsCount: number;
}

export interface CarrierShipmentResult {
  trackingNumber: string;
  carrier: string;
  estimatedDeliveryDays: number;
  labelUrl?: string;
}

export interface TrackingResult {
  trackingNumber: string;
  status: string;
  location: string;
  description: string;
  timestamp: Date;
}

export interface IShippingProvider {
  readonly carrierName: string;

  createShipment(request: CreateCarrierShipmentRequest): Promise<CarrierShipmentResult>;

  getTracking(trackingNumber: string): Promise<TrackingResult>;

  cancelShipment(trackingNumber: string): Promise<void>;

  verifyWebhook(payload: string, signature: string): Promise<boolean>;
}
