import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional } from 'class-validator';

export enum MeasurementKindDto {
  body = 'body',
  garment = 'garment',
  final = 'final',
}

export enum MeasurementSourceDto {
  manual = 'manual',
  garment = 'garment',
  questionnaire = 'questionnaire',
  scan = 'scan',
  in_store = 'in_store',
}

export class AddMeasurementDto {
  @ApiProperty({ enum: MeasurementKindDto, default: MeasurementKindDto.body })
  @IsEnum(MeasurementKindDto)
  kind!: MeasurementKindDto;

  @ApiProperty({ enum: MeasurementSourceDto, default: MeasurementSourceDto.manual })
  @IsEnum(MeasurementSourceDto)
  source!: MeasurementSourceDto;

  @ApiProperty({
    description: 'Measurement values in centimetres',
    example: { chest: 100, waist: 88, hip: 102, shoulder: 46, sleeveLength: 62 },
  })
  @IsObject()
  values!: Record<string, number>;

  @ApiPropertyOptional({
    description: 'Second entry for critical measurements (dual-entry check)',
    example: { chest: 100, waist: 88, hip: 102 },
  })
  @IsOptional()
  @IsObject()
  confirmValues?: Record<string, number>;
}
