import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsOptional,
  Min,
  Max,
  IsDateString,
} from 'class-validator';

/**
 * Vehicle types for mileage calculation
 */
export enum VehicleType {
  CAR = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE',
  BICYCLE = 'BICYCLE',
  ELECTRIC_CAR = 'ELECTRIC_CAR',
  ELECTRIC_MOTORCYCLE = 'ELECTRIC_MOTORCYCLE',
}

/**
 * Training/education types
 */
export enum TrainingType {
  PROFESSIONAL_DEVELOPMENT = 'PROFESSIONAL_DEVELOPMENT',
  DEGREE_PROGRAM = 'DEGREE_PROGRAM',
  CERTIFICATION = 'CERTIFICATION',
  LANGUAGE_COURSE = 'LANGUAGE_COURSE',
  CONFERENCE = 'CONFERENCE',
  WORKSHOP = 'WORKSHOP',
}

/**
 * Base input for all calculators
 */
export class BaseCalculatorInput {
  @ApiProperty({
    description: 'ISO country code',
    example: 'DE',
  })
  @IsString()
  countryCode!: string;

  @ApiPropertyOptional({
    description: 'Tax year for calculation (defaults to current year)',
    example: 2024,
  })
  @IsOptional()
  @IsNumber()
  @Min(2020)
  @Max(2030)
  taxYear?: number;

  @ApiPropertyOptional({
    description: 'Tax rate for savings estimation (0-100)',
    example: 42,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;
}

/**
 * Commuter allowance calculator input
 */
export class CommuterCalculatorInput extends BaseCalculatorInput {
  @ApiProperty({
    description: 'Distance from home to work (km, one-way)',
    example: 25,
  })
  @IsNumber()
  @Min(0)
  distanceKm!: number;

  @ApiProperty({
    description: 'Number of working days per year',
    example: 220,
  })
  @IsNumber()
  @Min(1)
  @Max(366)
  workingDays!: number;

  @ApiPropertyOptional({
    description: 'Whether public transport is used',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  usePublicTransport?: boolean;
}

/**
 * Home office flat rate calculator input
 */
export class HomeOfficeFlatCalculatorInput extends BaseCalculatorInput {
  @ApiProperty({
    description: 'Number of days worked from home',
    example: 180,
  })
  @IsNumber()
  @Min(1)
  @Max(366)
  daysWorked!: number;
}

/**
 * Home office room-based calculator input
 */
export class HomeOfficeRoomCalculatorInput extends BaseCalculatorInput {
  @ApiProperty({
    description: 'Size of home office room (square meters)',
    example: 15,
  })
  @IsNumber()
  @Min(0.1)
  roomSqm!: number;

  @ApiProperty({
    description: 'Total size of home/apartment (square meters)',
    example: 80,
  })
  @IsNumber()
  @Min(0.1)
  totalSqm!: number;

  @ApiProperty({
    description: 'Monthly rent or ownership cost',
    example: 1200,
  })
  @IsNumber()
  @Min(0)
  monthlyRent!: number;

  @ApiProperty({
    description: 'Number of months used for work',
    example: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  months!: number;
}

/**
 * Per diem (meal allowance) calculator input
 */
export class PerDiemCalculatorInput extends BaseCalculatorInput {
  @ApiProperty({
    description: 'Trip start date and time (ISO 8601)',
    example: '2024-03-15T08:00:00Z',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    description: 'Trip end date and time (ISO 8601)',
    example: '2024-03-17T18:00:00Z',
  })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({
    description: 'Destination country code (for international trips)',
    example: 'FR',
  })
  @IsOptional()
  @IsString()
  destination?: string;

  @ApiPropertyOptional({
    description: 'Whether this is an international trip',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isInternational?: boolean;
}

/**
 * Mileage calculator input
 */
export class MileageCalculatorInput extends BaseCalculatorInput {
  @ApiProperty({
    description: 'Distance traveled for business (km)',
    example: 350,
  })
  @IsNumber()
  @Min(0)
  distanceKm!: number;

  @ApiProperty({
    description: 'Type of vehicle used',
    example: VehicleType.CAR,
    enum: VehicleType,
  })
  @IsEnum(VehicleType)
  vehicleType!: VehicleType;
}

/**
 * Training/education calculator input
 */
export class TrainingCalculatorInput extends BaseCalculatorInput {
  @ApiProperty({
    description: 'Total cost of training/education',
    example: 2500,
  })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({
    description: 'Type of training/education',
    example: TrainingType.CERTIFICATION,
    enum: TrainingType,
  })
  @IsEnum(TrainingType)
  trainingType!: TrainingType;
}
