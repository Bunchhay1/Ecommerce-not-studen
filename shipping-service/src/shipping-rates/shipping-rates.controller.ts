import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ShippingRatesService } from './shipping-rates.service';
import { GetShippingRatesQueryDto } from './dto/shipping-rate.dto';

@ApiTags('Shipping Rates')
@Controller('api/v1/shipping/rates')
export class ShippingRatesController {
  constructor(private readonly ratesService: ShippingRatesService) {}

  @Get()
  @ApiOperation({ summary: 'Get available shipping methods and estimated fees' })
  async getRates(@Query() query: GetShippingRatesQueryDto) {
    return this.ratesService.getRates(query);
  }
}
