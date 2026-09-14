import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RatingsService } from './ratings.service';

@ApiTags('Ratings')
@Controller('products')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Get(':productId/rating')
  @ApiOperation({ summary: 'Get aggregated rating summary for a product' })
  @ApiResponse({ status: 200, description: 'Rating summary retrieved successfully' })
  async getProductRating(@Param('productId') productId: string) {
    return this.ratingsService.getRatingSummary(productId);
  }
}
