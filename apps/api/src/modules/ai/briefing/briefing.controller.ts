import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { BriefingService } from './briefing.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { GetUser } from '@/modules/auth/decorators/get-user.decorator';
import { GetOrganisation } from '@/modules/auth/decorators/get-organisation.decorator';
import { DailyBriefing, WeeklyBriefing, BriefingContext } from './briefing.types';

/**
 * Briefing Controller
 * Endpoints for AI-generated financial briefings
 *
 * This is a P1 High priority feature for the "fully automatic" vision
 */
@Controller('briefing')
@UseGuards(JwtAuthGuard)
export class BriefingController {
  private readonly logger = new Logger(BriefingController.name);

  constructor(private readonly briefingService: BriefingService) {}

  /**
   * GET /briefing/daily
   * Get today's daily briefing
   *
   * Query params:
   * - date: Optional ISO date string (defaults to today)
   * - includeProjections: Include future projections (default: true)
   * - includeRecommendations: Include AI recommendations (default: true)
   */
  @Get('daily')
  async getDailyBriefing(
    @GetOrganisation() orgId: string,
    @GetUser('id') userId: string,
    @Query('date') dateStr?: string,
    @Query('includeProjections') includeProjections?: string,
    @Query('includeRecommendations') includeRecommendations?: string,
  ): Promise<DailyBriefing> {
    this.logger.log(`Fetching daily briefing for org ${orgId}`);

    // Parse date or use today
    let date: Date;
    try {
      date = dateStr ? new Date(dateStr) : new Date();
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      throw new BadRequestException('Invalid date format. Use ISO 8601 format (YYYY-MM-DD)');
    }

    const context: BriefingContext = {
      orgId,
      userId,
      date,
      includeProjections: includeProjections !== 'false',
      includeRecommendations: includeRecommendations !== 'false',
    };

    return this.briefingService.generateDailyBriefing(context);
  }

  /**
   * GET /briefing/weekly
   * Get this week's briefing with weekly summary
   *
   * Query params:
   * - date: Optional ISO date string (defaults to today, will get week containing this date)
   */
  @Get('weekly')
  async getWeeklyBriefing(
    @GetOrganisation() orgId: string,
    @GetUser('id') userId: string,
    @Query('date') dateStr?: string,
  ): Promise<WeeklyBriefing> {
    this.logger.log(`Fetching weekly briefing for org ${orgId}`);

    // Parse date or use today
    let date: Date;
    try {
      date = dateStr ? new Date(dateStr) : new Date();
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      throw new BadRequestException('Invalid date format. Use ISO 8601 format (YYYY-MM-DD)');
    }

    const context: BriefingContext = {
      orgId,
      userId,
      date,
      includeProjections: true,
      includeRecommendations: true,
    };

    return this.briefingService.generateWeeklyBriefing(context);
  }

  /**
   * POST /briefing/generate
   * Force regenerate briefing (bypasses any caching)
   *
   * Body:
   * - type: 'daily' | 'weekly'
   * - date: Optional ISO date string
   */
  @Post('generate')
  async generateBriefing(
    @GetOrganisation() orgId: string,
    @GetUser('id') userId: string,
    @Query('type') type: 'daily' | 'weekly' = 'daily',
    @Query('date') dateStr?: string,
  ): Promise<DailyBriefing | WeeklyBriefing> {
    this.logger.log(`Force generating ${type} briefing for org ${orgId}`);

    // Parse date or use today
    let date: Date;
    try {
      date = dateStr ? new Date(dateStr) : new Date();
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      throw new BadRequestException('Invalid date format. Use ISO 8601 format (YYYY-MM-DD)');
    }

    const context: BriefingContext = {
      orgId,
      userId,
      date,
      includeProjections: true,
      includeRecommendations: true,
    };

    if (type === 'weekly') {
      return this.briefingService.generateWeeklyBriefing(context);
    } else {
      return this.briefingService.generateDailyBriefing(context);
    }
  }
}
