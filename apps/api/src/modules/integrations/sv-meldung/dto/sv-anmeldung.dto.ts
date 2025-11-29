import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsOptional,
  ValidateNested,
  IsNumber,
  Matches,
  Length,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Abgabegrund } from '../interfaces/deuev-message.interface';

/**
 * Address DTO
 */
export class AddressDto {
  @ApiProperty({ description: 'Street name' })
  @IsString()
  @IsNotEmpty()
  strasse!: string;

  @ApiProperty({ description: 'House number' })
  @IsString()
  @IsNotEmpty()
  hausnummer!: string;

  @ApiProperty({ description: 'Postal code' })
  @IsString()
  @Matches(/^\d{5}$/, { message: 'Postal code must be 5 digits' })
  plz!: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  @IsNotEmpty()
  ort!: string;

  @ApiPropertyOptional({ description: 'Country code (ISO 3166-1 alpha-3)' })
  @IsString()
  @IsOptional()
  @Length(3, 3)
  land?: string;
}

/**
 * Beitragsgruppen (Contribution groups) DTO
 */
export class BeitragsgruppenDto {
  @ApiProperty({
    description: 'Krankenversicherung (Health insurance): 0-6',
    example: '1',
  })
  @IsString()
  @Matches(/^[0-6]$/, { message: 'KV must be 0-6' })
  kv!: string;

  @ApiProperty({
    description: 'Rentenversicherung (Pension insurance): 0-9',
    example: '1',
  })
  @IsString()
  @Matches(/^[0-9]$/, { message: 'RV must be 0-9' })
  rv!: string;

  @ApiProperty({
    description: 'Arbeitslosenversicherung (Unemployment insurance): 0-2',
    example: '1',
  })
  @IsString()
  @Matches(/^[0-2]$/, { message: 'AV must be 0-2' })
  av!: string;

  @ApiProperty({
    description: 'Pflegeversicherung (Nursing care insurance): 0-2',
    example: '1',
  })
  @IsString()
  @Matches(/^[0-2]$/, { message: 'PV must be 0-2' })
  pv!: string;

  [key: string]: string;
}

/**
 * SV-Anmeldung (Social Security Registration) DTO
 */
export class SvAnmeldungDto {
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
    description: 'Versicherungsnummer (Insurance number) - 12 characters',
    example: '12345678A901',
  })
  @IsString()
  @Matches(/^\d{8}[A-Z]\d{3}$/, {
    message: 'Invalid Versicherungsnummer format',
  })
  versicherungsnummer!: string;

  @ApiProperty({ description: 'Last name', example: 'Müller' })
  @IsString()
  @IsNotEmpty()
  nachname!: string;

  @ApiProperty({ description: 'First name', example: 'Hans' })
  @IsString()
  @IsNotEmpty()
  vorname!: string;

  @ApiProperty({
    description: 'Date of birth (ISO 8601)',
    example: '1990-01-15',
  })
  @IsDateString()
  geburtsdatum!: string;

  @ApiProperty({
    description: 'Gender',
    enum: ['M', 'W', 'D'],
    example: 'M',
  })
  @IsEnum(['M', 'W', 'D'])
  geschlecht!: 'M' | 'W' | 'D';

  @ApiProperty({
    description: 'Nationality (ISO 3166-1 alpha-3)',
    example: 'DEU',
  })
  @IsString()
  @Length(3, 3)
  staatsangehoerigkeit!: string;

  @ApiProperty({ description: 'Address information' })
  @ValidateNested()
  @Type(() => AddressDto)
  anschrift!: AddressDto;

  @ApiProperty({
    description: 'Employment start date (ISO 8601)',
    example: '2024-01-01',
  })
  @IsDateString()
  beschaeftigungBeginn!: string;

  @ApiProperty({ description: 'Contribution groups' })
  @ValidateNested()
  @Type(() => BeitragsgruppenDto)
  beitragsgruppen!: BeitragsgruppenDto;

  @ApiPropertyOptional({
    description: 'Monthly salary/wage in euros',
    example: 3500.0,
  })
  @IsNumber()
  @IsOptional()
  entgelt?: number;

  @ApiProperty({
    description: 'Personengruppe (Person group): 101-190',
    example: '101',
  })
  @IsString()
  @Matches(/^1[0-9]{2}$/, {
    message: 'Personengruppe must be between 101-190',
  })
  personengruppe!: string;

  @ApiPropertyOptional({
    description: 'Tätigkeitsschlüssel (Activity key)',
    example: '01101',
  })
  @IsString()
  @IsOptional()
  taetigkeitsschluessel?: string;

  @ApiProperty({
    description: 'Health insurance carrier IK',
    example: '108018347',
  })
  @IsString()
  @Matches(/^\d{9}$/, { message: 'Health carrier IK must be 9 digits' })
  krankenkasseIk!: string;

  @ApiPropertyOptional({
    description: 'Health insurance carrier name',
    example: 'AOK',
  })
  @IsString()
  @IsOptional()
  krankenkasseName?: string;

  @ApiPropertyOptional({
    description: 'Reason code override (default: 10 for new employment)',
    enum: Abgabegrund,
  })
  @IsEnum(Abgabegrund)
  @IsOptional()
  abgabegrund?: Abgabegrund;

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
