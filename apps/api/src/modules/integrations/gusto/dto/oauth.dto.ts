import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiateOAuthDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsNotEmpty()
  @IsUUID()
  organisationId: string;
}

export class OAuthCallbackDto {
  @ApiProperty({ example: 'auth_code_123abc' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 'state_xyz789' })
  @IsNotEmpty()
  @IsString()
  state: string;
}

export class OAuthInitiateResponseDto {
  @ApiProperty({ example: 'https://api.gusto-demo.com/oauth/authorize?...' })
  authorizationUrl: string;

  @ApiProperty({ example: 'state_xyz789' })
  state: string;
}

export class OAuthCallbackResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'comp_abc123' })
  companyUuid: string;

  @ApiProperty({ example: 'Acme Corp' })
  companyName?: string;

  @ApiProperty({ example: 'Connection established successfully' })
  message: string;
}

export class DisconnectDto {
  @ApiProperty({ example: 'comp_abc123' })
  @IsNotEmpty()
  @IsString()
  companyUuid: string;
}

export class ConnectionStatusDto {
  @ApiProperty({ example: 'comp_abc123' })
  companyUuid: string;

  @ApiProperty({ example: 'Acme Corp' })
  companyName?: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty()
  connectedAt: Date;

  @ApiProperty({ required: false })
  lastSyncAt?: Date;

  @ApiProperty({ example: ['company:read', 'employee:write'] })
  scopes: string[];
}
