import { Global, Module } from '@nestjs/common';
import { ShippingEventProducer } from './shipping-event.producer';

@Global()
@Module({
  providers: [ShippingEventProducer],
  exports: [ShippingEventProducer],
})
export class KafkaModule {}
