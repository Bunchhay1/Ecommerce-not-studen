import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ShipmentsService } from './shipments.service';
import { UpdateShipmentStatusDto } from './dto/update-shipment.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ShipmentStatus } from '@prisma/client';

@ApiTags('Admin Shipments')
@Controller('api/v1/admin/shipments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('ROLE_ADMIN')
export class AdminShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin list all shipments (paginated with status filter)' })
  async getAllShipments(
    @Query('page') page = 1,
    @Query('size') size = 20,
    @Query('status') status?: ShipmentStatus,
  ) {
    return this.shipmentsService.getAllShipments(Number(page), Number(size), status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin get shipment details by ID' })
  async getShipmentById(@Param('id') id: string) {
    return this.shipmentsService.getShipmentById(id, 'admin', true);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Admin update shipment status and dispatch tracking event' })
  async updateShipmentStatus(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentStatusDto,
  ) {
    return this.shipmentsService.updateShipmentStatus(id, dto);
  }
}
