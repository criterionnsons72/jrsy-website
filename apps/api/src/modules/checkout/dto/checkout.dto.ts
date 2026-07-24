import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
  @ApiProperty() @IsString() fullName!: string;
  @ApiProperty() @IsString() phone!: string;
  @ApiProperty() @IsString() line!: string;
  @ApiProperty() @IsString() city!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() postalCode?: string;
}

export class CheckoutDto {
  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;

  @ApiProperty({ enum: ['standard', 'express'] })
  @IsIn(['standard', 'express'])
  shippingMethod!: 'standard' | 'express';

  @ApiProperty({ enum: ['card', 'cod'] })
  @IsIn(['card', 'cod'])
  paymentMethod!: 'card' | 'cod';

  @ApiProperty({ description: 'Customer accepts the custom-order policy' })
  @IsBoolean()
  acceptPolicy!: boolean;

  @ApiPropertyOptional({ description: 'Required for made-to-measure items' })
  @IsOptional()
  @IsBoolean()
  measurementApproved?: boolean;

  @ApiPropertyOptional({ description: 'Tax rate 0–1 (configurable; default 0)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  taxRate?: number;
}
