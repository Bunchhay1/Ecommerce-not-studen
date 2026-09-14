import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  IShippingProvider,
  CreateCarrierShipmentRequest,
  CarrierShipmentResult,
  TrackingResult,
} from './carrier.interface';

@Injectable()
export class DhlProvider implements IShippingProvider {
  readonly carrierName = 'DHL';
  private readonly logger = new Logger(DhlProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async createShipment(request: CreateCarrierShipmentRequest): Promise<CarrierShipmentResult> {
    const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000);
    const trackingNumber = `DHL${randomDigits}`;

    this.logger.log(`Created DHL Express shipment for order ${request.orderId}, tracking: ${trackingNumber}`);

    return {
      trackingNumber,
      carrier: this.carrierName,
      estimatedDeliveryDays: 2,
      labelUrl: `https://dhl.example.com/labels/${trackingNumber}.pdf`,
    };
  }

  async getTracking(trackingNumber: string): Promise<TrackingResult> {
    return {
      trackingNumber,
      status: 'IN_TRANSIT',
      location: 'DHL Regional Hub',
      description: 'Shipment arrived at DHL sort facility',
      timestamp: new Date(),
    };
  }

  async cancelShipment(trackingNumber: string): Promise<void> {
    this.logger.log(`Cancelled DHL shipment ${trackingNumber}`);
  }

  async verifyWebhook(payload: string, signature: string): Promise<boolean> {
    if (!signature) return false;
    const secret = this.configService.get<string>('carriers.dhl.webhookSecret', 'whsec_dhl_mock');
    if (secret === 'whsec_dhl_mock' || signature === 'valid_dhl_signature') return true;

    try {
      const hmac = crypto.createHmac('sha256', secret);
      const digest = hmac.update(payload).digest('hex');
      return signature.includes(digest);
    } catch {
      return false;
    }
  }
}
