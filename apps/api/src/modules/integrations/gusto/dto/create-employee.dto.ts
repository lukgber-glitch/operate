import { IsString, IsNotEmpty, IsOptional, IsEmail, IsArray, ValidateNested, IsEnum, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class EmployeeAddressDto {
  @ApiProperty({ example: '123 Main St' })
  @IsNotEmpty()
  @IsString()
  street_1: string;

  @ApiProperty({ required: false, example: 'Apt 4B' })
  @IsOptional()
  @IsString()
  street_2?: string;

  @ApiProperty({ example: 'San Francisco' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ example: 'CA' })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({ example: '94105' })
  @IsNotEmpty()
  @IsString()
  zip: string;
}

export enum PaymentUnit {
  Hour = 'Hour',
  Week = 'Week',
  Month = 'Month',
  Year = 'Year',
  Paycheck = 'Paycheck',
}

export class EmployeeJobDto {
  @ApiProperty({ example: 'loc_abc123' })
  @IsNotEmpty()
  @IsString()
  location_uuid: string;

  @ApiProperty({ example: '2024-01-01' })
  @IsNotEmpty()
  @IsString()
  hire_date: string;

  @ApiProperty({ example: 'Software Engineer' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ required: false, example: '75000' })
  @IsOptional()
  @IsString()
  rate?: string;

  @ApiProperty({ required: false, enum: PaymentUnit, example: 'Year' })
  @IsOptional()
  payment_unit?: PaymentUnit;
}

export class CreateEmployeeDto {
  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  @IsString()
  last_name: string;

  @ApiProperty({ required: false, example: 'john.doe@acme.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, example: '1990-01-01' })
  @IsOptional()
  @IsString()
  date_of_birth?: string;

  @ApiProperty({ required: false, example: '123-45-6789' })
  @IsOptional()
  @IsString()
  ssn?: string;

  @ApiProperty({ required: false, type: EmployeeAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmployeeAddressDto)
  home_address?: EmployeeAddressDto;

  @ApiProperty({ type: [EmployeeJobDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EmployeeJobDto)
  jobs: EmployeeJobDto[];
}

export class UpdateEmployeeDto {
  @ApiProperty({ required: false, example: 'John' })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({ required: false, example: 'Doe' })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ required: false, example: 'john.doe@acme.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, type: EmployeeAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmployeeAddressDto)
  home_address?: EmployeeAddressDto;
}

export class SyncEmployeesDto {
  @ApiProperty({ example: 'comp_abc123' })
  @IsNotEmpty()
  @IsString()
  companyUuid: string;
}

export class SyncEmployeesResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 5 })
  employeesCreated: number;

  @ApiProperty({ example: 3 })
  employeesUpdated: number;

  @ApiProperty({ example: 0 })
  employeesSkipped: number;

  @ApiProperty({ type: [Object] })
  errors: Array<{
    employeeUuid: string;
    error: string;
  }>;
}
