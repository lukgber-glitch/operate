import { ApiProperty } from '@nestjs/swagger';

export class QuickBooksAuthUrlDto {
  @ApiProperty({
    description: 'QuickBooks OAuth authorization URL',
    example: 'https://appcenter.intuit.com/connect/oauth2?client_id=...&response_type=code&scope=...&redirect_uri=...&state=...',
  })
  authUrl: string;

  @ApiProperty({
    description: 'State parameter for CSRF protection',
    example: 'abc123def456',
  })
  state: string;
}
