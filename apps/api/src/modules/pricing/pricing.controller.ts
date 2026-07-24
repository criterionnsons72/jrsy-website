import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { QuoteDto } from './dto/quote.dto';

@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  /** Live price for a configuration — the number shown in the configurator. */
  @Post('quote')
  quote(@Body() dto: QuoteDto) {
    return this.pricing.quote(dto.productSlug, dto.selections, {
      urgent: dto.urgent,
      taxRate: dto.taxRate,
      shipping: dto.shipping,
    });
  }
}
