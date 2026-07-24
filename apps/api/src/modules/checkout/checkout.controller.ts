import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CheckoutService } from './checkout.service';
import { CheckoutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../identity/strategies/jwt.strategy';

@ApiTags('checkout')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @Post()
  place(@Req() req: Request, @Body() dto: CheckoutDto) {
    return this.checkout.checkout((req.user as AuthenticatedUser).id, dto);
  }
}
