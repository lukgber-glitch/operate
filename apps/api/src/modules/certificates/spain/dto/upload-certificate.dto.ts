import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadSpainCertificateDto {
  @ApiProperty({
    description: 'User-friendly name for the certificate',
    example: 'Production SII Certificate 2024',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Optional description of the certificate',
    example: 'Main certificate for SII submissions',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description:
      'Base64-encoded PKCS#12 certificate file (.p12 or .pfx) from FNMT',
    example: 'MIIKDAIBAzCCCc...',
  })
  @IsString()
  @IsNotEmpty()
  certificateData: string; // Base64-encoded PKCS#12 file

  @ApiProperty({
    description: 'Password to decrypt the PKCS#12 certificate',
    example: 'MySecureP@ssw0rd',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  password: string;

  @ApiProperty({
    description: 'Environment for the certificate (production or test)',
    enum: ['production', 'test'],
    example: 'production',
    default: 'production',
  })
  @IsEnum(['production', 'test'])
  @IsOptional()
  environment?: 'production' | 'test' = 'production';

  @ApiProperty({
    description: 'Spanish tax ID (CIF/NIF) associated with the certificate',
    example: 'B12345678',
    required: false,
    pattern: '^[A-Z][0-9]{7}[A-Z0-9]$',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[A-Z][0-9]{7}[A-Z0-9]$/, {
    message: 'CIF/NIF must match Spanish tax ID format (e.g., B12345678)',
  })
  cifNif?: string;
}

export class UpdateSpainCertificateDto {
  @ApiProperty({
    description: 'Updated name for the certificate',
    example: 'Updated Production SII Certificate',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'Updated description',
    example: 'Updated main certificate for SII submissions',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Mark certificate as active or inactive',
    example: true,
    required: false,
  })
  @IsOptional()
  isActive?: boolean;
}

export class RotateSpainCertificateDto {
  @ApiProperty({
    description: 'ID of the certificate to be replaced',
    example: 'cert_old_123',
  })
  @IsString()
  @IsNotEmpty()
  oldCertificateId: string;

  @ApiProperty({
    description: 'User-friendly name for the new certificate',
    example: 'Production SII Certificate 2025',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Optional description for the new certificate',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Base64-encoded new PKCS#12 certificate file',
  })
  @IsString()
  @IsNotEmpty()
  certificateData: string;

  @ApiProperty({
    description: 'Password for the new certificate',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  password: string;

  @ApiProperty({
    description: 'Environment for the new certificate',
    enum: ['production', 'test'],
    default: 'production',
  })
  @IsEnum(['production', 'test'])
  @IsOptional()
  environment?: 'production' | 'test' = 'production';
}

export class TestAEATConnectionDto {
  @ApiProperty({
    description: 'ID of the certificate to test',
    example: 'cert_123',
  })
  @IsString()
  @IsNotEmpty()
  certificateId: string;

  @ApiProperty({
    description: 'AEAT environment to test against',
    enum: ['production', 'test'],
    example: 'test',
    default: 'test',
  })
  @IsEnum(['production', 'test'])
  @IsOptional()
  environment?: 'production' | 'test' = 'test';
}
