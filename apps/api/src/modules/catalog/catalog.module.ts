import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { FabricController } from './fabric.controller';

@Module({
  controllers: [ProductController, CategoryController, FabricController],
  providers: [ProductService, CategoryService],
  exports: [ProductService],
})
export class CatalogModule {}
