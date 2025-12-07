import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  Matches,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Abgabegrund } from '../interfaces/deuev-message.interface';

/**
 * SV-Abmeldung (Social Security Deregistration) DTO
 */
export class SvAbmeldungDto {
  @ApiProperty({
    description: 'Employee ID (internal reference)',
    example: 'emp_123456',
  })
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @ApiProperty({
    description: 'Betriebsnummer (Employer ID)',
    example: '12345678',
  })
  @IsString()
  @Matches(/^\d{8}$/, { message: 'Betriebsnummer must be 8 digits' })
  betriebsnummer!: string;

  @ApiProperty({
    description: 'Versicherungsnummer (Insurance number)',
    example: '12345678A901',
  })
  @IsString()
  @Matches(/^\d{8}[A-Z]\d{3}$/, {
    message: 'Invalid Versicherungsnummer format',
  })
  versicherungsnummer!: string;

  @ApiProperty({
    description: 'Employment end date (ISO 8601)',
    example: '2024-12-31',
  })
  @IsDateString()
  beschaeftigungEnde!: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Müller',
  })
  @IsString()
  @IsNotEmpty()
  nachname!: string;

  @ApiProperty({
    description: 'First name',
    example: 'Hans',
  })
  @IsString()
  @IsNotEmpty()
  vorname!: string;

  @ApiProperty({
    description: 'Date of birth (ISO 8601)',
    example: '1990-01-15',
  })
  @IsDateString()
  geburtsdatum!: string;

  @ApiPropertyOptional({
    description: 'Reason for deregistration',
    enum: Abgabegrund,
    default: 'ENDE',
  })
  @IsOptional()
  abgabegrund?: Abgabegrund;

  @ApiPropertyOptional({
    description: 'Final salary/wage in euros (for final settlement)',
    example: 3500.0,
  })
  @IsOptional()
  entgelt?: number;

  @ApiPropertyOptional({
    description: 'Health insurance carrier IK',
    example: '108018347',
  })
  @IsString()
  @Matches(/^\d{9}$/, { message: 'Health carrier IK must be 9 digits' })
  @IsOptional()
  krankenkasseIk?: string;

  @ApiPropertyOptional({
    description: 'Severance pay information',
  })
  @IsOptional()
  abfindung?: {
    betrag: number;
    zeitraumVon: string;
    zeitraumBis: string;
  };

  @ApiPropertyOptional({
    description: 'Additional notes',
  })
  @IsString()
  @IsOptional()
  notizen?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Auto-submit to carrier',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  autoSubmit?: boolean;
}
