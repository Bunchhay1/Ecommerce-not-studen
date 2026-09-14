import { Controller, Post, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VotesService } from './votes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Votes')
@Controller('reviews')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post(':id/helpful')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vote a review as helpful' })
  @ApiResponse({ status: 200, description: 'Helpful vote recorded' })
  async voteHelpful(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 'anonymous-user';
    return this.votesService.voteHelpful(id, userId);
  }

  @Delete(':id/helpful')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove helpful vote from a review' })
  async removeHelpfulVote(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 'anonymous-user';
    return this.votesService.removeHelpfulVote(id, userId);
  }
}
