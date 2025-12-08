import { ApiProperty } from '@nestjs/swagger';

/**
 * Session DTO
 * Represents an active user session
 */
export class SessionDto {
  @ApiProperty({
    description: 'Session ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'IP address of the session',
    example: '192.168.1.1',
    required: false,
  })
  ipAddress?: string;

  @ApiProperty({
    description: 'User agent string',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    required: false,
  })
  userAgent?: string;

  @ApiProperty({
    description: 'Whether this is the current session',
    example: true,
  })
  isCurrent: boolean;

  @ApiProperty({
    description: 'Session creation date',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Session expiration date',
    example: '2024-01-22T10:30:00Z',
  })
  expiresAt: Date;
}

/**
 * Response DTO for listing user sessions
 */
export class SessionsResponseDto {
  @ApiProperty({
    description: 'List of active sessions',
    type: [SessionDto],
  })
  sessions: SessionDto[];

  @ApiProperty({
    description: 'Total number of active sessions',
    example: 3,
  })
  total: number;

  @ApiProperty({
    description: 'Maximum allowed sessions per user',
    example: 5,
  })
  maxSessions: number;
}
