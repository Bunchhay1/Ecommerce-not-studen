import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ShipmentsService } from './shipments.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { CancelShipmentDto } from './dto/cancel-shipment.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('Shipments')
@Controller('api/v1/shipments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new shipment for an order' })
  async createShipment(@Req() req: any, @Body() dto: CreateShipmentDto) {
    const userId = req.user?.id || 'anonymousUser';
    return this.shipmentsService.createShipment(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List shipments for the authenticated user' })
  async getUserShipments(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('size') size = 20,
  ) {
    const userId = req.user?.id || 'anonymousUser';
    return this.shipmentsService.getUserShipments(userId, Number(page), Number(size));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shipment details by ID' })
  async getShipmentById(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id || 'anonymousUser';
    const isAdmin = req.user?.roles?.includes('ROLE_ADMIN') || false;
    return this.shipmentsService.getShipmentById(id, userId, isAdmin);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get all shipments associated with an order ID' })
  async getShipmentsByOrderId(@Req() req: any, @Param('orderId') orderId: string) {
    const userId = req.user?.id || 'anonymousUser';
    const isAdmin = req.user?.roles?.includes('ROLE_ADMIN') || false;
    return this.shipmentsService.getShipmentsByOrderId(orderId, userId, isAdmin);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pending shipment' })
  async cancelShipment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CancelShipmentDto,
  ) {
    const userId = req.user?.id || 'anonymousUser';
    const isAdmin = req.user?.roles?.includes('ROLE_ADMIN') || false;
    return this.shipmentsService.cancelShipment(id, dto, userId, isAdmin);
  }
}
