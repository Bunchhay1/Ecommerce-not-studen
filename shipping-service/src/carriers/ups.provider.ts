import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IShippingProvider,
  CreateCarrierShipmentRequest,
  CarrierShipmentResult,
  TrackingResult,
} from './carrier.interface';

@Injectable()
export class UpsProvider implements IShippingProvider {
  readonly carrierName = 'UPS';
  private readonly logger = new Logger(UpsProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async createShipment(request: CreateCarrierShipmentRequest): Promise<CarrierShipmentResult> {
    const randomSuffix = Math.floor(1000000000 + Math.random() * 9000000000);
    const trackingNumber = `1Z999999${randomSuffix}`;

    this.logger.log(`Created UPS shipment for order ${request.orderId}, tracking: ${trackingNumber}`);

    return {
      trackingNumber,
      carrier: this.carrierName,
      estimatedDeliveryDays: 2,
      labelUrl: `https://ups.example.com/labels/${trackingNumber}.pdf`,
    };
  }

  async getTracking(trackingNumber: string): Promise<TrackingResult> {
    return {
      trackingNumber,
      status: 'IN_TRANSIT',
      location: 'UPS Hub',
      description: 'Package scanned at UPS sorting center',
      timestamp: new Date(),
    };
  }

  async cancelShipment(trackingNumber: string): Promise<void> {
    this.logger.log(`Cancelled UPS shipment ${trackingNumber}`);
  }

  async verifyWebhook(payload: string, signature: string): Promise<boolean> {
    return Boolean(signature && signature.length > 0);
  }
}
