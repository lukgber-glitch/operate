import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Test Login DTO
 * Used ONLY in development/test environments for automated testing
 * Allows bypassing OAuth flow for E2E tests
 */
export class TestLoginDto {
  @ApiProperty({
    description: 'Test user email address',
    example: 'test@example.com',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'Test authentication secret (from TEST_AUTH_SECRET env var)',
    example: 'test-secret-key',
  })
  @IsString()
  @IsNotEmpty({ message: 'Test secret is required' })
  testSecret: string;
}
