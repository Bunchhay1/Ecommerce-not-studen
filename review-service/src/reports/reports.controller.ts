import { Controller, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Reports')
@Controller('reviews')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report an inappropriate review' })
  @ApiResponse({ status: 201, description: 'Review report filed successfully' })
  async reportReview(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: CreateReportDto,
  ) {
    const userId = req.user?.userId || 'anonymous-user';
    return this.reportsService.reportReview(id, userId, dto);
  }
}
