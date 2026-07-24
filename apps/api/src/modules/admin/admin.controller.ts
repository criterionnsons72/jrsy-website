import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  CreateCategoryDto,
  CreateCouponDto,
  CreateFabricDto,
  CreateProductDto,
} from './dto/admin.dto';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../identity/guards/roles.guard';
import { Roles } from '../identity/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Roles('admin', 'super_admin', 'finance', 'support', 'production_manager')
  @Get('overview')
  overview() {
    return this.admin.overview();
  }

  @Roles('admin', 'super_admin', 'finance', 'support')
  @Get('orders')
  orders(@Query('status') status?: string, @Query('take') take?: string) {
    return this.admin.orders({ status, take: take ? Number(take) : undefined });
  }

  @Roles('admin', 'super_admin')
  @Get('audit-logs')
  audit(@Query('take') take?: string) {
    return this.admin.auditLogs(take ? Number(take) : undefined);
  }

  // ---- Catalog management ----
  @Roles('catalog_manager', 'admin', 'super_admin')
  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.admin.createCategory(dto);
  }

  @Roles('catalog_manager', 'admin', 'super_admin')
  @Post('fabrics')
  createFabric(@Body() dto: CreateFabricDto) {
    return this.admin.createFabric(dto);
  }

  @Roles('catalog_manager', 'admin', 'super_admin')
  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.admin.createProduct(dto);
  }

  // ---- Coupons ----
  @Roles('finance', 'admin', 'super_admin')
  @Get('coupons')
  listCoupons() {
    return this.admin.listCoupons();
  }

  @Roles('finance', 'admin', 'super_admin')
  @Post('coupons')
  createCoupon(@Body() dto: CreateCouponDto) {
    return this.admin.createCoupon(dto);
  }

  @Roles('finance', 'admin', 'super_admin')
  @Patch('coupons/:id/deactivate')
  deactivateCoupon(@Param('id') id: string) {
    return this.admin.deactivateCoupon(id);
  }
}
