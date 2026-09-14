import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IShippingProvider,
  CreateCarrierShipmentRequest,
  CarrierShipmentResult,
  TrackingResult,
} from './carrier.interface';

@Injectable()
export class FedexProvider implements IShippingProvider {
  readonly carrierName = 'FEDEX';
  private readonly logger = new Logger(FedexProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async createShipment(request: CreateCarrierShipmentRequest): Promise<CarrierShipmentResult> {
    const randomDigits = Math.floor(100000000000 + Math.random() * 900000000000);
    const trackingNumber = `FDX${randomDigits}`;

    this.logger.log(`Created FedEx shipment for order ${request.orderId}, tracking: ${trackingNumber}`);

    return {
      trackingNumber,
      carrier: this.carrierName,
      estimatedDeliveryDays: 2,
      labelUrl: `https://fedex.example.com/labels/${trackingNumber}.pdf`,
    };
  }

  async getTracking(trackingNumber: string): Promise<TrackingResult> {
    return {
      trackingNumber,
      status: 'IN_TRANSIT',
      location: 'FedEx Facility',
      description: 'Departed FedEx location',
      timestamp: new Date(),
    };
  }

  async cancelShipment(trackingNumber: string): Promise<void> {
    this.logger.log(`Cancelled FedEx shipment ${trackingNumber}`);
  }

  async verifyWebhook(payload: string, signature: string): Promise<boolean> {
    return Boolean(signature && signature.length > 0);
  }
}
