import { ApiProperty } from '@nestjs/swagger';

export class QuickBooksConnectionStatusDto {
  @ApiProperty({
    description: 'Whether QuickBooks is connected',
    example: true,
  })
  isConnected: boolean;

  @ApiProperty({
    description: 'Connection status',
    enum: ['CONNECTED', 'DISCONNECTED', 'EXPIRED', 'ERROR'],
    example: 'CONNECTED',
  })
  status: 'CONNECTED' | 'DISCONNECTED' | 'EXPIRED' | 'ERROR';

  @ApiProperty({
    description: 'QuickBooks company ID (realm ID)',
    example: '123456789',
    nullable: true,
  })
  companyId: string | null;

  @ApiProperty({
    description: 'QuickBooks company name',
    example: 'Acme Corporation',
    nullable: true,
  })
  companyName: string | null;

  @ApiProperty({
    description: 'Last successful sync timestamp',
    example: '2024-12-02T10:30:00.000Z',
    nullable: true,
  })
  lastSyncAt: Date | null;

  @ApiProperty({
    description: 'Access token expiry timestamp',
    example: '2024-12-02T11:30:00.000Z',
  })
  tokenExpiresAt: Date;

  @ApiProperty({
    description: 'Refresh token expiry timestamp',
    example: '2025-03-15T10:30:00.000Z',
  })
  refreshTokenExpiresAt: Date;

  @ApiProperty({
    description: 'Environment (sandbox or production)',
    example: 'sandbox',
  })
  environment: string;

  @ApiProperty({
    description: 'Last error message if any',
    example: null,
    nullable: true,
  })
  lastError: string | null;

  @ApiProperty({
    description: 'When the connection was established',
    example: '2024-12-01T10:30:00.000Z',
  })
  connectedAt: Date;
}
