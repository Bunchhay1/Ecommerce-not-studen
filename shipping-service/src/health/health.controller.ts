import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class HealthController {
  @Get(['health', 'health/live', 'health/ready', 'api/v1/health'])
  @ApiOperation({ summary: 'Health check endpoint' })
  check() {
    return {
      status: 'UP',
      service: 'shipping-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
