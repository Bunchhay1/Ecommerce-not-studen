import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';

@ApiTags('Tracking')
@Controller('api/v1/shipments')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get(':id/tracking')
  @ApiOperation({ summary: 'Get shipment tracking progression history by shipment ID' })
  async getTrackingByShipmentId(@Param('id') id: string) {
    return this.trackingService.getTrackingByShipmentId(id);
  }

  @Get('tracking/:trackingNumber')
  @ApiOperation({ summary: 'Public tracking lookup by carrier tracking number' })
  async getTrackingByTrackingNumber(@Param('trackingNumber') trackingNumber: string) {
    return this.trackingService.getTrackingByTrackingNumber(trackingNumber);
  }
}
