import { ApiProperty } from '@nestjs/swagger';

/**
 * Xero Connection Status Response DTO
 */
export class XeroConnectionStatusDto {
  @ApiProperty({
    description: 'Connection unique identifier',
    example: 'uuid-123',
  })
  id: string;

  @ApiProperty({
    description: 'Organization ID',
    example: 'org-456',
  })
  orgId: string;

  @ApiProperty({
    description: 'Xero tenant (organization) ID',
    example: 'xero-tenant-789',
  })
  xeroTenantId: string;

  @ApiProperty({
    description: 'Xero organization name',
    example: 'My Company Ltd',
    nullable: true,
  })
  xeroOrgName: string | null;

  @ApiProperty({
    description: 'Connection status',
    example: 'CONNECTED',
    enum: ['CONNECTED', 'DISCONNECTED', 'EXPIRED', 'ERROR'],
  })
  status: string;

  @ApiProperty({
    description: 'Whether the connection is currently active',
    example: true,
  })
  isConnected: boolean;

  @ApiProperty({
    description: 'Last successful sync timestamp',
    example: '2024-01-15T10:30:00Z',
    nullable: true,
  })
  lastSyncAt: Date | null;

  @ApiProperty({
    description: 'Last error message if any',
    example: null,
    nullable: true,
  })
  lastError: string | null;

  @ApiProperty({
    description: 'Access token expiry timestamp',
    example: '2024-01-15T11:00:00Z',
  })
  tokenExpiresAt: Date;

  @ApiProperty({
    description: 'Refresh token expiry timestamp',
    example: '2024-03-15T10:30:00Z',
  })
  refreshTokenExpiresAt: Date;

  @ApiProperty({
    description: 'Connection establishment timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  connectedAt: Date;
}
