import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

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
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() madeToMeasure?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() readySize?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() configSchemaId?: string;
  @ApiPropertyOptional({ type: [String], description: 'Image URLs (first is the cover).' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class UpdateProductDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) basePrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() madeToMeasure?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() readySize?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() configSchemaId?: string;
  @ApiPropertyOptional({ type: [String], description: 'Replaces all images when provided.' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class CreateCouponDto {
  @ApiProperty() @IsString() code!: string;
  @ApiProperty({ enum: ['percent', 'fixed'] })
  @IsIn(['percent', 'fixed'])
  kind!: 'percent' | 'fixed';
  @ApiProperty() @IsNumber() @Min(0) value!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() expiresAt?: string;
}
