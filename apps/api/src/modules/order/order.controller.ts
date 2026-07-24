import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../identity/strategies/jwt.strategy';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orders: OrderService) {}

  private userId(req: Request): string {
    return (req.user as AuthenticatedUser).id;
  }

  /** Create a draft order from the current cart. */
  @Post()
  create(@Req() req: Request) {
    return this.orders.createFromCart(this.userId(req));
  }

  @Get()
  list(@Req() req: Request) {
    return this.orders.list(this.userId(req));
  }

  @Get(':id')
  get(@Req() req: Request, @Param('id') id: string) {
    return this.orders.get(this.userId(req), id);
  }
}
