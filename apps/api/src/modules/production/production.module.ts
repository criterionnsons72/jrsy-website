import { Module } from '@nestjs/common';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { DocumentsService } from './documents.service';

@Module({
  controllers: [ProductionController],
  providers: [ProductionService, DocumentsService],
  exports: [ProductionService, DocumentsService],
})
export class ProductionModule {}
