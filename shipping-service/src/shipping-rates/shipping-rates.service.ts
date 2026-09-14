import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { GetShippingRatesQueryDto, ShippingRateOption } from './dto/shipping-rate.dto';

@Injectable()
export class ShippingRatesService {
  constructor(private readonly redis: RedisService) {}

  async getRates(query: GetShippingRatesQueryDto): Promise<{ rates: ShippingRateOption[] }> {
    const cacheKey = `shipping:rates:${query.city || 'default'}:${query.country || 'default'}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    // Standard rate matrix
    const rates: ShippingRateOption[] = [
      {
        method: 'STANDARD',
        fee: 3.0,
        currency: 'USD',
        estimatedDays: 3,
        description: 'Standard doorstep delivery',
      },
      {
        method: 'EXPRESS',
        fee: 7.0,
        currency: 'USD',
        estimatedDays: 1,
        description: 'Fast express priority shipment',
      },
      {
        method: 'NEXT_DAY',
        fee: 10.0,
        currency: 'USD',
        estimatedDays: 1,
        description: 'Guaranteed delivery on the next business day',
      },
      {
        method: 'SAME_DAY',
        fee: 15.0,
        currency: 'USD',
        estimatedDays: 0,
        description: 'Same-day urgent courier delivery',
      },
      {
        method: 'PICKUP',
        fee: 0.0,
        currency: 'USD',
        estimatedDays: 1,
        description: 'Self-pickup at nearby distribution center',
      },
    ];

    const result = { rates };
    await this.redis.set(cacheKey, result, 600);
    return result;
  }
}
