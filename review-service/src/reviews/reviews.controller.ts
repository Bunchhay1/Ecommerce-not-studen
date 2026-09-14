import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product review' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  async createReview(@Req() req: any, @Body() dto: CreateReviewDto) {
    const userId = req.user?.userId || 'anonymous-user';
    return this.reviewsService.createReview(userId, dto);
  }

  @Get('reviews/products/:productId')
  @Get('reviews/product/:productId')
  @Get('products/:productId/reviews')
  @ApiOperation({ summary: 'Get paginated reviews for a product' })
  async getProductReviews(
    @Param('productId') productId: string,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewsService.getProductReviews(productId, query);
  }

  @Get('reviews/:id')
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiResponse({ status: 200, description: 'Review retrieved successfully' })
  async getReview(@Param('id') id: string) {
    return this.reviewsService.getReviewById(id);
  }

  @Patch('reviews/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing review' })
  async updateReview(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateReviewDto,
  ) {
    const userId = req.user?.userId || 'anonymous-user';
    return this.reviewsService.updateReview(id, userId, dto);
  }

  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a review' })
  async deleteReview(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 'anonymous-user';
    const isAdmin = req.user?.role === 'ADMIN';
    return this.reviewsService.deleteReview(id, userId, isAdmin);
  }
}
