import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';
import { ConfigSchemaAdminService } from './config-schema-admin.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../identity/guards/roles.guard';
import { Roles } from '../identity/decorators/roles.decorator';

class CreateSchemaDto {
  @IsString() name!: string;
  @IsObject() definition!: unknown;
}
class SaveSchemaDto {
  @IsObject() definition!: unknown;
}

@ApiTags('admin-configurator')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('catalog_manager', 'admin', 'super_admin')
@Controller('admin/config-schemas')
export class ConfigSchemaAdminController {
  constructor(private readonly schemas: ConfigSchemaAdminService) {}

  @Get()
  list() {
    return this.schemas.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.schemas.get(id);
  }

  @Post()
  create(@Body() dto: CreateSchemaDto) {
    return this.schemas.create(dto.name, dto.definition);
  }

  @Post(':id/versions')
  saveVersion(@Param('id') id: string, @Body() dto: SaveSchemaDto) {
    return this.schemas.saveNewVersion(id, dto.definition);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.schemas.publish(id);
  }
}
