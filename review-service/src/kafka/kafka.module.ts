import { Global, Module } from '@nestjs/common';
import { ReviewEventProducer } from './review-event.producer';

@Global()
@Module({
  providers: [ReviewEventProducer],
  exports: [ReviewEventProducer],
})
export class KafkaModule {}
