import {
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  IsDateString,
  Matches,
  IsEnum,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Abgabegrund } from '../interfaces/deuev-message.interface';
import { BeitragsgruppenDto, AddressDto } from './sv-anmeldung.dto';

/**
 * Change type enumeration
 */
export enum AenderungType {
  /** Contribution group change */
  BEITRAGSGRUPPE = 'BEITRAGSGRUPPE',

  /** Salary change */
  ENTGELT = 'ENTGELT',

  /** Address change */
  ANSCHRIFT = 'ANSCHRIFT',

  /** Health carrier change */
  KRANKENKASSE = 'KRANKENKASSE',

  /** Name change (marriage, etc.) */
  NAME = 'NAME',

  /** Multiple changes */
  MEHRFACH = 'MEHRFACH',
}

/**
 * SV-Änderung (Social Security Change Notification) DTO
 */
export class SvAenderungDto {
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
    description: 'Effective date of change (ISO 8601)',
    example: '2024-06-01',
  })
  @IsDateString()
  aenderungsdatum!: string;

  @ApiProperty({
    description: 'Type of change',
    enum: AenderungType,
    example: 'BEITRAGSGRUPPE',
  })
  aenderungType!: AenderungType;

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
    description: 'New contribution groups (if changed)',
  })
  @ValidateNested()
  @Type(() => BeitragsgruppenDto)
  @IsOptional()
  neueBeitragsgruppen?: BeitragsgruppenDto;

  @ApiPropertyOptional({
    description: 'New salary/wage in euros (if changed)',
    example: 4000.0,
  })
  @IsNumber()
  @IsOptional()
  neuesEntgelt?: number;

  @ApiPropertyOptional({
    description: 'New address (if changed)',
  })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  neueAnschrift?: AddressDto;

  @ApiPropertyOptional({
    description: 'New health carrier IK (if changed)',
    example: '108312448',
  })
  @IsString()
  @Matches(/^\d{9}$/, { message: 'Health carrier IK must be 9 digits' })
  @IsOptional()
  neueKrankenkasseIk?: string;

  @ApiPropertyOptional({
    description: 'New last name (if changed, e.g., marriage)',
  })
  @IsString()
  @IsOptional()
  neuerNachname?: string;

  @ApiPropertyOptional({
    description: 'New first name (if changed)',
  })
  @IsString()
  @IsOptional()
  neuerVorname?: string;

  @ApiPropertyOptional({
    description: 'Reason code for change',
    enum: Abgabegrund,
    default: 'AENDERUNG',
  })
  @IsOptional()
  abgabegrund?: Abgabegrund;

  @ApiPropertyOptional({
    description: 'Description of change',
  })
  @IsString()
  @IsOptional()
  beschreibung?: string;

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
