import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../database/prisma.service';
import { EmailFilterService } from './email-filter.service';
import { RequestWithUser } from '../../../common/types/request.types';

@ApiTags('Email Filter Config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('email-intelligence/filter-config')
export class EmailFilterController {
  constructor(
    private readonly emailFilterService: EmailFilterService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get email filter configuration' })
  async getConfig(@Request() req: RequestWithUser) {
    const orgId = req.user.orgId;

    // Get DB config
    let dbConfig = await this.prisma.emailFilterConfig.findUnique({
      where: { orgId },
    });

    // Create default if doesn't exist
    if (!dbConfig) {
      await this.emailFilterService.createDefaultConfig(orgId, 'B2B');
      dbConfig = await this.prisma.emailFilterConfig.findUnique({
        where: { orgId },
      });
    }

    return dbConfig;
  }

  @Patch()
  @ApiOperation({ summary: 'Update email filter configuration' })
  async updateConfig(@Request() req: RequestWithUser, @Body() updates: any) {
    const orgId = req.user.orgId;

    // Ensure config exists
    const existing = await this.prisma.emailFilterConfig.findUnique({
      where: { orgId },
    });

    if (!existing) {
      await this.emailFilterService.createDefaultConfig(orgId, 'B2B');
    }

    // Update with provided values
    const updated = await this.prisma.emailFilterConfig.update({
      where: { orgId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return updated;
  }
}
