import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { KafkaProducer } from '../kafka/kafka.producer';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly kafkaProducer: KafkaProducer,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Service health status' })
  health() {
    return {
      status: 'UP',
      service: 'cart-service',
      version: '1.0.0',
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  live() {
    return { status: 'UP' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe checking dependencies' })
  async ready() {
    const postgresOk = await this.prismaService.isHealthy();
    const redisOk = await this.redisService.isHealthy();
    const kafkaOk = this.kafkaProducer.isHealthy();

    const allOk = postgresOk && redisOk;
    const status = allOk ? 'UP' : 'DEGRADED';

    return {
      status,
      postgres: postgresOk ? 'UP' : 'DOWN',
      redis: redisOk ? 'UP' : 'DOWN',
      kafka: kafkaOk ? 'UP' : 'DOWN',
    };
  }
}
