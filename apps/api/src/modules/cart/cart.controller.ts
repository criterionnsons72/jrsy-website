import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../identity/strategies/jwt.strategy';

@ApiTags('cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  private userId(req: Request): string {
    return (req.user as AuthenticatedUser).id;
  }

  @Get()
  get(@Req() req: Request) {
    return this.cart.getCart(this.userId(req));
  }

  @Post('items')
  add(@Req() req: Request, @Body() dto: AddCartItemDto) {
    return this.cart.addItem(this.userId(req), dto);
  }

  @Patch('items/:itemId')
  update(@Req() req: Request, @Param('itemId') itemId: string, @Body() dto: UpdateCartItemDto) {
    return this.cart.updateItem(this.userId(req), itemId, dto.quantity);
  }

  @Delete('items/:itemId')
  remove(@Req() req: Request, @Param('itemId') itemId: string) {
    return this.cart.removeItem(this.userId(req), itemId);
  }
}
