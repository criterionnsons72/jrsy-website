import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewDecisionDto {
  @ApiProperty({ description: 'true = approve & lock, false = reject' })
  @IsBoolean()
  approve!: boolean;

  @ApiPropertyOptional({ description: 'Reviewer note (required on reject)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
