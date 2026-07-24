import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() slug!: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() sortOrder?: number;
}

export class CreateFabricDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ enum: ['stretch', 'non_stretch'] })
  @IsIn(['stretch', 'non_stretch'])
  stretch!: 'stretch' | 'non_stretch';
  @ApiProperty() @IsNumber() @Min(0) pricePerUnit!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() colorHex?: string;
}

export class CreateProductDto {
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsString() slug!: string;
  @ApiProperty() @IsString() categoryId!: string;
  @ApiProperty() @IsNumber() @Min(0) basePrice!: number;
  @ApiPropertyOptional() @IsOptional() configSchemaId?: string;
}

export class CreateCouponDto {
  @ApiProperty() @IsString() code!: string;
  @ApiProperty({ enum: ['percent', 'fixed'] })
  @IsIn(['percent', 'fixed'])
  kind!: 'percent' | 'fixed';
  @ApiProperty() @IsNumber() @Min(0) value!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() expiresAt?: string;
}
