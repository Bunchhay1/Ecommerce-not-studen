import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdateCartStatusDto } from './dto/update-cart-status.dto';
import {
  CartResponseDto,
  CartSummaryDto,
} from './dto/cart-response.dto';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current customer shopping cart' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  async getCart(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CartResponseDto> {
    return this.cartService.getCart(user.userId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get quick cart summary (counts and totals)' })
  @ApiResponse({ status: 200, type: CartSummaryDto })
  async getCartSummary(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CartSummaryDto> {
    return this.cartService.getSummary(user.userId);
  }

  @Post('items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add product variant to cart' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.addItem(user.userId, dto);
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async updateItemQuantity(
    @CurrentUser() user: AuthenticatedUser,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.updateItemQuantity(user.userId, itemId, dto);
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remove an item from cart' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  async removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('itemId') itemId: string,
  ): Promise<CartResponseDto> {
    return this.cartService.removeItem(user.userId, itemId);
  }

  @Delete('items')
  @ApiOperation({ summary: 'Clear all items from cart' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  async clearCart(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CartResponseDto> {
    return this.cartService.clearCart(user.userId);
  }

  @Patch('status')
  @ApiOperation({ summary: 'Update cart lifecycle status (CHECKOUT, CONVERTED, ABANDONED)' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCartStatusDto,
  ): Promise<CartResponseDto> {
    return this.cartService.updateStatus(user.userId, dto);
  }
}
