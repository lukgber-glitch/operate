import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserDto } from './dto/user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Users Controller
 * Handles user profile management operations
 */
@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * Get current user profile
   */
  @Get('me')
  @ApiOperation({
    summary: 'Get current user',
    description: 'Retrieve authenticated user profile',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getCurrentUser(@Req() req: Request): Promise<UserDto> {
    if (!req.user?.userId) {
      throw new NotFoundException('User not authenticated');
    }

    const user = await this.usersService.findById(req.user.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update current user profile
   */
  @Patch('me')
  @ApiOperation({
    summary: 'Update current user',
    description: 'Update authenticated user profile',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    type: UserDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async updateCurrentUser(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDto> {
    if (!req.user?.userId) {
      throw new NotFoundException('User not authenticated');
    }

    return this.usersService.update(req.user.userId, updateUserDto);
  }
}
