import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

/**
 * User DTO for API responses
 * Excludes sensitive fields like password hash and MFA secret
 */
export class UserDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  avatarUrl: string | null;

  @ApiProperty({
    description: 'User locale/language preference',
    example: 'de',
  })
  locale: string;

  @ApiProperty({
    description: 'Whether MFA is enabled',
    example: false,
  })
  mfaEnabled: boolean;

  @ApiProperty({
    description: 'Last login timestamp',
    example: '2024-01-15T10:30:00Z',
    nullable: true,
  })
  lastLoginAt: Date | null;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;

  // Exclude sensitive fields from serialization
  @Exclude()
  passwordHash: string;

  @Exclude()
  mfaSecret: string | null;

  @Exclude()
  deletedAt: Date | null;

  constructor(partial: Partial<UserDto>) {
    Object.assign(this, partial);
  }
}
