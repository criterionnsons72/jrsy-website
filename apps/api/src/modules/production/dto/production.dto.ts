import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const ORDER_STATUSES = [
  'draft',
  'measurement_review',
  'customer_approval',
  'payment_complete',
  'measurement_locked',
  'pattern_preparation',
  'fabric_allocation',
  'cutting',
  'stitching',
  'quality_control',
  'packing',
  'dispatch',
  'delivered',
  'cancelled',
] as const;

export class AdvanceDto {
  @ApiProperty({ enum: ORDER_STATUSES })
  @IsString()
  to!: string;
}

export class AssignDto {
  @ApiPropertyOptional({ description: 'Operator user id, or null to unassign' })
  @IsOptional()
  @IsString()
  operatorId?: string | null;
}

export class PriorityDto {
  @ApiProperty({ minimum: 0, maximum: 10 })
  @IsInt()
  @Min(0)
  @Max(10)
  priority!: number;

  @ApiPropertyOptional({ description: 'Due date (ISO)' })
  @IsOptional()
  @IsString()
  dueAt?: string;
}

export class NoteDto {
  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  note!: string;
}

export class QcDto {
  @ApiProperty({ description: 'true = pass → packing, false = fail → remake' })
  @IsBoolean()
  pass!: boolean;

  @ApiPropertyOptional({ description: 'Finished-garment measurements (cm)' })
  @IsOptional()
  @IsObject()
  finalMeasurements?: Record<string, number>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
