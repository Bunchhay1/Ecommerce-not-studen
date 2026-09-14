import { Injectable, Logger } from '@nestjs/common';
import {
  IShippingProvider,
  CreateCarrierShipmentRequest,
  CarrierShipmentResult,
  TrackingResult,
} from './carrier.interface';

@Injectable()
export class LocalCarrierProvider implements IShippingProvider {
  readonly carrierName = 'LOCAL';
  private readonly logger = new Logger(LocalCarrierProvider.name);

  async createShipment(request: CreateCarrierShipmentRequest): Promise<CarrierShipmentResult> {
    const randomSuffix = Math.floor(10000000 + Math.random() * 90000000);
    const trackingNumber = `LOC${randomSuffix}KH`;

    this.logger.log(`Created Local shipment for order ${request.orderId}, tracking: ${trackingNumber}`);

    let estimatedDeliveryDays = 3;
    if (request.shippingMethod === 'EXPRESS') estimatedDeliveryDays = 1;
    if (request.shippingMethod === 'SAME_DAY') estimatedDeliveryDays = 0;

    return {
      trackingNumber,
      carrier: this.carrierName,
      estimatedDeliveryDays,
      labelUrl: `https://labels.example.com/${trackingNumber}.pdf`,
    };
  }

  async getTracking(trackingNumber: string): Promise<TrackingResult> {
    return {
      trackingNumber,
      status: 'IN_TRANSIT',
      location: 'Phnom Penh Hub',
      description: 'Package in transit with local carrier',
      timestamp: new Date(),
    };
  }

  async cancelShipment(trackingNumber: string): Promise<void> {
    this.logger.log(`Cancelled local shipment ${trackingNumber}`);
  }

  async verifyWebhook(payload: string, signature: string): Promise<boolean> {
    return Boolean(signature && signature.length > 0);
  }
}
