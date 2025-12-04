/**
 * ZATCA CSID Onboarding DTOs
 */

import { IsString, IsNotEmpty } from 'class-validator';

export class OnboardComplianceCSIDDto {
  @IsString()
  @IsNotEmpty()
  organizationName: string;

  @IsString()
  @IsNotEmpty()
  organizationIdentifier: string; // TRN

  @IsString()
  @IsNotEmpty()
  organizationalUnitName: string;

  @IsString()
  @IsNotEmpty()
  countryCode: string;

  @IsString()
  @IsNotEmpty()
  privateKey: string; // PEM format
}

export class RequestProductionCSIDDto {
  @IsString()
  @IsNotEmpty()
  complianceRequestId: string;
}
