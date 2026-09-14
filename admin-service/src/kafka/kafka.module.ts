import { Module, Global } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
