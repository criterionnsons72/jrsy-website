import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { ListProductsDto } from './dto/list-products.dto';

@ApiTags('catalog')
@Controller('products')
export class ProductController {
  constructor(private readonly products: ProductService) {}

  @Get()
  list(@Query() query: ListProductsDto) {
    return this.products.list(query);
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.products.getBySlug(slug);
  }
}
