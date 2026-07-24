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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ProductionService } from './production.service';
import { DocumentsService, type DocumentType } from './documents.service';
import { AdvanceDto, AssignDto, NoteDto, PriorityDto, QcDto } from './dto/production.dto';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../identity/guards/roles.guard';
import { Roles } from '../identity/decorators/roles.decorator';
import type { AuthenticatedUser } from '../identity/strategies/jwt.strategy';
import type { OrderStatus } from './order-flow';

function actor(req: Request): string {
  return (req.user as AuthenticatedUser).id;
}

@ApiTags('production')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('workshop_operator', 'production_manager', 'qc_officer', 'tailor', 'admin', 'super_admin')
@Controller('production')
export class ProductionController {
  constructor(
    private readonly production: ProductionService,
    private readonly documents: DocumentsService,
  ) {}

  @Get('queue')
  queue(@Query('stage') stage?: OrderStatus, @Query('operatorId') operatorId?: string) {
    return this.production.queue({ stage, operatorId });
  }

  @Patch('orders/:id/advance')
  advance(@Req() req: Request, @Param('id') id: string, @Body() dto: AdvanceDto) {
    return this.production.advance(id, dto.to as OrderStatus, actor(req));
  }

  @Patch('orders/:id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignDto) {
    return this.production.assignOperator(id, dto.operatorId ?? null);
  }

  @Patch('orders/:id/priority')
  priority(@Param('id') id: string, @Body() dto: PriorityDto) {
    return this.production.setPriority(id, dto.priority, dto.dueAt);
  }

  @Patch('orders/:id/note')
  note(@Param('id') id: string, @Body() dto: NoteDto) {
    return this.production.addNote(id, dto.note);
  }

  @Post('orders/:id/qc')
  qc(@Req() req: Request, @Param('id') id: string, @Body() dto: QcDto) {
    return this.production.qcDecision(id, actor(req), dto);
  }

  // Documents
  @Post('orders/:id/documents/:type')
  generateDoc(@Param('id') id: string, @Param('type') type: DocumentType) {
    return this.documents.generate(id, type);
  }

  @Get('orders/:id/documents')
  listDocs(@Param('id') id: string) {
    return this.documents.list(id);
  }

  @Get('orders/:id/documents/:type')
  getDoc(@Param('id') id: string, @Param('type') type: DocumentType) {
    return this.documents.get(id, type);
  }
}
