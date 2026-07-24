import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum FitPreferenceDto {
  slim = 'slim',
  regular = 'regular',
  relaxed = 'relaxed',
}

export class CreateProfileDto {
  @ApiProperty({ example: 'Mine' })
  @IsString()
  @MaxLength(60)
  label!: string;

  @ApiPropertyOptional({ example: 175 })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(250)
  heightCm?: number;

  @ApiPropertyOptional({ example: 72 })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  weightKg?: number;

  @ApiPropertyOptional({ enum: FitPreferenceDto, default: FitPreferenceDto.regular })
  @IsOptional()
  @IsEnum(FitPreferenceDto)
  fitPreference?: FitPreferenceDto;
}
