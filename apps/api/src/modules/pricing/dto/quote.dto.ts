import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';
import type { Selections } from '../../configurator/schema.types';

export class QuoteDto {
  @ApiProperty()
  @IsString()
  productSlug!: string;

  @ApiProperty({ example: { fabric: 'linen', collar: 'band', embroidery: 'chest_logo' } })
  @IsObject()
  selections!: Selections;

  @ApiPropertyOptional({ description: 'Rush order (+surcharge)' })
  @IsOptional()
  @IsBoolean()
  urgent?: boolean;

  @ApiPropertyOptional({ description: 'Tax rate 0–1 (configurable; default 0)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  taxRate?: number;

  @ApiPropertyOptional({ description: 'Flat shipping amount (default 0)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shipping?: number;
}
