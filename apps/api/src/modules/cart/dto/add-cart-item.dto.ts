import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1, maximum: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  quantity = 1;

  @ApiPropertyOptional({ description: 'Fit preference (slim | regular | relaxed)' })
  @IsOptional()
  @IsString()
  fitPreference?: string;

  @ApiPropertyOptional({
    description:
      'Configurator selections snapshot (fabric, collar, embroidery, …). ' +
      'When present, the item price reflects the configured garment.',
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, string | number | boolean>;

  @ApiPropertyOptional({ description: 'Saved body-measurement profile to attach.' })
  @IsOptional()
  @IsUUID()
  bodyProfileId?: string;
}
