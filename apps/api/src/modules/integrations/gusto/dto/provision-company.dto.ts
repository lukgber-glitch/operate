import { IsString, IsEmail, IsNotEmpty, IsOptional, ValidateNested, IsArray, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CompanyLocationDto {
  @ApiProperty({ required: false, example: '+1-555-123-4567' })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiProperty({ example: '123 Main St' })
  @IsNotEmpty()
  @IsString()
  street_1: string;

  @ApiProperty({ required: false, example: 'Suite 100' })
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

  @ApiProperty({ required: false, example: 'US', default: 'US' })
  @IsOptional()
  @IsString()
  country?: string;
}

export class CompanyDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ required: false, example: 'Acme' })
  @IsOptional()
  @IsString()
  trade_name?: string;

  @ApiProperty({ required: false, example: '12-3456789' })
  @IsOptional()
  @IsString()
  ein?: string;

  @ApiProperty({ required: false, example: 'LLC' })
  @IsOptional()
  @IsString()
  entity_type?: string;

  @ApiProperty({ type: [CompanyLocationDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CompanyLocationDto)
  locations: CompanyLocationDto[];
}

export class UserDto {
  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  @IsString()
  last_name: string;

  @ApiProperty({ example: 'john.doe@acme.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: false, example: '+1-555-123-4567' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class ProvisionCompanyDto {
  @ApiProperty({ type: UserDto })
  @ValidateNested()
  @Type(() => UserDto)
  user: UserDto;

  @ApiProperty({ type: CompanyDto })
  @ValidateNested()
  @Type(() => CompanyDto)
  company: CompanyDto;
}

export class ProvisionCompanyResponseDto {
  @ApiProperty({ example: 'abc123' })
  companyUuid: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty()
  expiresAt: Date;
}
