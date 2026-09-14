import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liveness and system health probe' })
  async check() {
    let dbStatus = 'UNKNOWN';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'UP';
    } catch {
      dbStatus = 'DEGRADED';
    }

    const redisStatus = this.redis.isHealthy() ? 'UP' : 'DEGRADED';

    return {
      status: 'UP',
      service: 'admin-service',
      port: 8015,
      timestamp: new Date().toISOString(),
      components: {
        database: dbStatus,
        redis: redisStatus,
      },
    };
  }

  @Get('liveness')
  @ApiOperation({ summary: 'Liveness probe for orchestrators' })
  liveness() {
    return { status: 'UP' };
  }

  @Get('readiness')
  @ApiOperation({ summary: 'Readiness probe for traffic routing' })
  readiness() {
    return { status: 'READY' };
  }
}
