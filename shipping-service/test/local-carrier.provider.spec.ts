import { LocalCarrierProvider } from '../src/carriers/local-carrier.provider';

describe('LocalCarrierProvider', () => {
  let provider: LocalCarrierProvider;

  beforeEach(() => {
    provider = new LocalCarrierProvider();
  });

  it('should create a local carrier shipment and return tracking number', async () => {
    const result = await provider.createShipment({
      shipmentNumber: 'SHP-20260913-001',
      orderId: 'order-1',
      shippingMethod: 'STANDARD',
      recipientName: 'John Doe',
      phone: '+85512345678',
      addressLine1: 'Street 101',
      city: 'Phnom Penh',
      country: 'Cambodia',
      postalCode: '12000',
      itemsCount: 2,
    });

    expect(result).toBeDefined();
    expect(result.carrier).toBe('LOCAL');
    expect(result.trackingNumber).toMatch(/^LOC\d+KH$/);
    expect(result.estimatedDeliveryDays).toBe(3);
  });

  it('should estimate same-day delivery for SAME_DAY method', async () => {
    const result = await provider.createShipment({
      shipmentNumber: 'SHP-20260913-002',
      orderId: 'order-2',
      shippingMethod: 'SAME_DAY',
      recipientName: 'Jane Doe',
      phone: '+85512345679',
      addressLine1: 'Street 202',
      city: 'Phnom Penh',
      country: 'Cambodia',
      postalCode: '12000',
      itemsCount: 1,
    });

    expect(result.estimatedDeliveryDays).toBe(0);
  });

  it('should return tracking progression', async () => {
    const tracking = await provider.getTracking('LOC12345678KH');
    expect(tracking).toBeDefined();
    expect(tracking.trackingNumber).toBe('LOC12345678KH');
    expect(tracking.status).toBe('IN_TRANSIT');
  });

  it('should verify webhook signatures', async () => {
    const valid = await provider.verifyWebhook('{}', 'signature-sample');
    expect(valid).toBe(true);
  });
});
