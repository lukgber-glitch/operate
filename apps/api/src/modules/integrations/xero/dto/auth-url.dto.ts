import { ApiProperty } from '@nestjs/swagger';

/**
 * Xero Authorization URL Response DTO
 */
export class XeroAuthUrlDto {
  @ApiProperty({
    description: 'OAuth2 authorization URL with PKCE challenge',
    example:
      'https://login.xero.com/identity/connect/authorize?response_type=code&client_id=...&redirect_uri=...&scope=...&state=...&code_challenge=...&code_challenge_method=S256',
  })
  authUrl: string;

  @ApiProperty({
    description: 'State parameter for CSRF protection',
    example: 'abc123xyz',
  })
  state: string;
}
