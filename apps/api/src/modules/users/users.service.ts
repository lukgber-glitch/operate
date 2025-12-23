import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UserDto } from './dto/user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { plainToInstance } from 'class-transformer';

/**
 * Users Service
 * Business logic for user management operations
 */
@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  /**
   * Find user by ID
   * Returns sanitized user data (excludes sensitive fields)
   */
  async findById(id: string): Promise<UserDto | null> {
    const user = await this.usersRepository.findById(id);

    if (!user || user.deletedAt) {
      return null;
    }

    // Get primary membership to include orgId and role
    const primaryMembership = await this.usersRepository.getPrimaryMembership(id);

    const userDto = plainToInstance(UserDto, user, {
      excludeExtraneousValues: false,
    });

    // Add orgId and role from primary membership
    if (primaryMembership) {
      userDto.orgId = primaryMembership.orgId;
      userDto.role = primaryMembership.role;
    }

    return userDto;
  }

  /**
   * Find user by email (internal use, includes password hash)
   */
  async findByEmailWithPassword(email: string) {
    const user = await this.usersRepository.findByEmail(email);

    if (!user || user.deletedAt) {
      return null;
    }

    return user;
  }

  /**
   * Update user profile
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    // Verify user exists
    const existingUser = await this.usersRepository.findById(id);
    if (!existingUser || existingUser.deletedAt) {
      throw new NotFoundException('User not found');
    }

    // Update user
    const updatedUser = await this.usersRepository.update(id, updateUserDto);

    return plainToInstance(UserDto, updatedUser, {
      excludeExtraneousValues: false,
    });
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.updateLastLogin(id);
  }

  /**
   * Check if email is already registered
   */
  async isEmailTaken(email: string): Promise<boolean> {
    return this.usersRepository.emailExists(email);
  }

  /**
   * Get AI consent status for user
   */
  async getAIConsent(userId: string): Promise<{ hasConsent: boolean; consentedAt: string | null }> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      return { hasConsent: false, consentedAt: null };
    }
    return {
      hasConsent: !!user.aiConsentAt,
      consentedAt: user.aiConsentAt?.toISOString() || null,
    };
  }

  /**
   * Grant AI consent for user
   */
  async grantAIConsent(userId: string): Promise<{ hasConsent: boolean; consentedAt: string }> {
    const now = new Date();
    await this.usersRepository.updateAIConsent(userId, now);
    return {
      hasConsent: true,
      consentedAt: now.toISOString(),
    };
  }
}
