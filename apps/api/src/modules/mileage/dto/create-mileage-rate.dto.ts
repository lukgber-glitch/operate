import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { VehicleType } from '@prisma/client';

/**
 * DTO for creating a custom mileage rate
 */
export class CreateMileageRateDto {
  @ApiProperty({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'US',
  })
  @IsString()
  country: string;

  @ApiProperty({
    description: 'Year this rate applies to',
    example: 2024,
  })
  @IsNumber()
  @Min(2020)
  @Max(2100)
  year: number;

  @ApiProperty({
    description: 'Type of vehicle',
    enum: VehicleType,
    example: VehicleType.CAR,
  })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiProperty({
    description: 'Rate per kilometer',
    example: 0.3,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  ratePerKm: number;

  @ApiProperty({
    description: 'Rate per mile',
    example: 0.67,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  ratePerMile: number;

  @ApiPropertyOptional({
    description: 'Whether this is an official government rate',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isOfficial?: boolean;

  @ApiProperty({
    description: 'Date this rate becomes effective',
    example: '2024-01-01',
  })
  @IsDateString()
  effectiveFrom: string;

  @ApiPropertyOptional({
    description: 'Date this rate expires (null = no expiry)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}
