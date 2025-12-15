import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { VehicleType } from '@prisma/client';

/**
 * DTO for creating a mileage entry
 */
export class CreateMileageEntryDto {
  @ApiProperty({
    description: 'Date of the trip',
    example: '2024-01-15',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    description: 'Trip description',
    example: 'Client meeting at downtown office',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Purpose of the trip',
    example: 'Business meeting',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  purpose?: string;

  @ApiPropertyOptional({
    description: 'Starting location',
    example: 'Office HQ',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  startLocation?: string;

  @ApiPropertyOptional({
    description: 'Ending location',
    example: 'Client Site, Downtown',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  endLocation?: string;

  @ApiPropertyOptional({
    description: 'Client ID if trip was client-related',
  })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({
    description: 'Project ID if trip was project-related',
  })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiProperty({
    description: 'Distance in kilometers',
    example: 45.5,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  distanceKm: number;

  @ApiPropertyOptional({
    description: 'Distance in miles (will be auto-calculated if not provided)',
    example: 28.27,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  distanceMiles?: number;

  @ApiProperty({
    description: 'Type of vehicle used',
    enum: VehicleType,
    example: VehicleType.CAR,
  })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiPropertyOptional({
    description: 'Whether this is a round trip',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRoundTrip?: boolean;

  @ApiPropertyOptional({
    description: 'Rate per km (will use org/country default if not provided)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  ratePerKm?: number;

  @ApiPropertyOptional({
    description: 'Rate per mile (will use org/country default if not provided)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  ratePerMile?: number;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'EUR',
    default: 'EUR',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;
}
