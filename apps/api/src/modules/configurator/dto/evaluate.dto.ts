import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';
import type { Selections } from '../schema.types';

export class EvaluateDto {
  @ApiProperty({ description: 'Product slug the configuration belongs to' })
  @IsString()
  productSlug!: string;

  @ApiProperty({
    description: 'Map of option group key -> selected value',
    example: { fabric: 'linen', collar: 'band', embroidery: 'chest_logo' },
  })
  @IsObject()
  selections!: Selections;
}
