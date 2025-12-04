import { ApiProperty } from '@nestjs/swagger';

export class SpainCertificateSummaryDto {
  @ApiProperty({ description: 'Certificate ID', example: 'cert_123' })
  id: string;

  @ApiProperty({
    description: 'Organisation ID',
    example: 'org_456',
  })
  organisationId: string;

  @ApiProperty({
    description: 'Certificate name',
    example: 'Production SII Certificate 2024',
  })
  name: string;

  @ApiProperty({
    description: 'Spanish tax ID (CIF/NIF)',
    example: 'B12345678',
    required: false,
  })
  cifNif?: string;

  @ApiProperty({
    description: 'Certificate serial number',
    example: '1234567890ABCDEF',
    required: false,
  })
  serialNumber?: string;

  @ApiProperty({
    description: 'Certificate issuer (FNMT)',
    example: 'CN=FNMT Clase 2 CA',
    required: false,
  })
  issuer?: string;

  @ApiProperty({
    description: 'Certificate subject',
    example: 'CN=Example Company, serialNumber=B12345678',
    required: false,
  })
  subject?: string;

  @ApiProperty({
    description: 'Certificate thumbprint (SHA-256)',
    example: 'A1B2C3D4E5F6...',
    required: false,
  })
  thumbprint?: string;

  @ApiProperty({
    description: 'Certificate valid from date',
    example: '2024-01-01T00:00:00Z',
  })
  validFrom: Date;

  @ApiProperty({
    description: 'Certificate valid until date',
    example: '2026-01-01T00:00:00Z',
  })
  validTo: Date;

  @ApiProperty({
    description: 'Environment (production or test)',
    enum: ['production', 'test'],
    example: 'production',
  })
  environment: 'production' | 'test';

  @ApiProperty({
    description: 'Whether the certificate is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Last time the certificate was used',
    example: '2024-12-01T12:00:00Z',
    required: false,
  })
  lastUsedAt?: Date;

  @ApiProperty({
    description: 'Certificate creation timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Certificate last update timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'User ID who created the certificate',
    example: 'user_789',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Days until certificate expires',
    example: 365,
  })
  daysUntilExpiry: number;

  @ApiProperty({
    description: 'Whether the certificate has expired',
    example: false,
  })
  isExpired: boolean;

  @ApiProperty({
    description: 'Whether the certificate is expiring soon (< 30 days)',
    example: false,
  })
  isExpiringSoon: boolean;
}

export class SpainCertificateCreatedDto {
  @ApiProperty({
    description: 'Created certificate details',
  })
  certificate: SpainCertificateSummaryDto;

  @ApiProperty({
    description: 'Validation warnings (if any)',
    example: ['Certificate expires in 25 days'],
    type: [String],
  })
  warnings: string[];
}

export class AEATTestResultDto {
  @ApiProperty({
    description: 'Whether the test was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Environment tested',
    enum: ['production', 'test'],
    example: 'test',
  })
  environment: 'production' | 'test';

  @ApiProperty({
    description: 'AEAT endpoint tested',
    example: 'https://prewww1.aeat.es/wlpl/SSII-FACT/ws/fe/SiiFactFEV1SOAP',
  })
  endpoint: string;

  @ApiProperty({
    description: 'Response time in milliseconds',
    example: 234,
  })
  responseTime: number;

  @ApiProperty({
    description: 'Whether the certificate was accepted by AEAT',
    example: true,
  })
  certificateValid: boolean;

  @ApiProperty({
    description: 'Errors encountered during test (if any)',
    type: [String],
    required: false,
  })
  errors?: string[];

  @ApiProperty({
    description: 'Test timestamp',
    example: '2024-12-03T10:00:00Z',
  })
  timestamp: Date;
}

export class CertificateRotationResultDto {
  @ApiProperty({
    description: 'ID of the old certificate (now inactive)',
    example: 'cert_old_123',
  })
  oldCertificateId: string;

  @ApiProperty({
    description: 'Details of the new active certificate',
  })
  newCertificate: SpainCertificateSummaryDto;

  @ApiProperty({
    description: 'Whether the rotation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Timestamp of rotation',
    example: '2024-12-03T10:00:00Z',
  })
  rotatedAt: Date;
}

export class ExpiringCertificatesDto {
  @ApiProperty({
    description: 'List of expiring certificates',
    type: [SpainCertificateSummaryDto],
  })
  certificates: SpainCertificateSummaryDto[];

  @ApiProperty({
    description: 'Total count of expiring certificates',
    example: 3,
  })
  total: number;

  @ApiProperty({
    description: 'Days ahead filter used',
    example: 30,
  })
  daysAhead: number;
}
