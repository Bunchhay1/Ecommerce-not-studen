import { ShippingRatesService } from '../src/shipping-rates/shipping-rates.service';
import { RedisService } from '../src/redis/redis.service';

describe('ShippingRatesService', () => {
  let service: ShippingRatesService;
  let redisMock: Partial<RedisService>;

  beforeEach(() => {
    redisMock = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };

    service = new ShippingRatesService(redisMock as RedisService);
  });

  it('should return available shipping rate tiers', async () => {
    const response = await service.getRates({
      city: 'Phnom Penh',
      country: 'Cambodia',
    });

    expect(response).toBeDefined();
    expect(response.rates).toBeDefined();
    expect(response.rates.length).toBe(5);

    const methods = response.rates.map((r) => r.method);
    expect(methods).toContain('STANDARD');
    expect(methods).toContain('EXPRESS');
    expect(methods).toContain('SAME_DAY');
    expect(methods).toContain('NEXT_DAY');
    expect(methods).toContain('PICKUP');

    const standardRate = response.rates.find((r) => r.method === 'STANDARD');
    expect(standardRate?.fee).toBe(3.0);
  });
});
