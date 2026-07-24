import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ImageMetaDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() width?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() height?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasFullBody?: boolean;
}

export class CreateTryOnDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({ description: 'Object-storage key of the uploaded image' })
  @IsString()
  inputAssetKey!: string;

  @ApiPropertyOptional({ type: ImageMetaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ImageMetaDto)
  imageMeta?: ImageMetaDto;
}

export class ConsentDto {
  @ApiProperty({ enum: ['tryon_image', 'body_scan'] })
  @IsString()
  purpose!: 'tryon_image' | 'body_scan';
}

export class BodyScanDto {
  @ApiProperty()
  @IsString()
  frontAssetKey!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sideAssetKey?: string;
}
