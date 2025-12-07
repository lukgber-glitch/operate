import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { TaxCalendarService } from './tax-calendar.service';
import { TaxDeadline, TaxCalendarFilters, TaxDeadlineType, TaxDeadlineStatus } from './types';
import { TaxDeadlineService } from '../deadlines/tax-deadline.service';

/**
 * Tax Calendar Controller
 * Endpoints for managing tax deadlines and calendar
 */
@Controller('tax/calendar')
export class TaxCalendarController {
  constructor(
    private readonly taxCalendarService: TaxCalendarService,
    private readonly taxDeadlineService: TaxDeadlineService,
  ) {}

  /**
   * Get all tax deadlines for organization
   * GET /tax/calendar?year=2024
   */
  @Get()
  async getDeadlines(
    @Req() req: any,
    @Query('year') year?: string,
  ): Promise<TaxDeadline[]> {
    const organizationId = req.user?.organisationId;
    if (!organizationId) {
      throw new BadRequestException('Organization ID not found in request');
    }

    const targetYear = year ? parseInt(year, 10) : undefined;

    if (targetYear && (isNaN(targetYear) || targetYear < 2000 || targetYear > 2100)) {
      throw new BadRequestException('Invalid year parameter');
    }

    return this.taxCalendarService.getDeadlines(organizationId, targetYear);
  }

  /**
   * Get upcoming deadlines within N days
   * GET /tax/calendar/upcoming?days=30
   */
  @Get('upcoming')
  async getUpcoming(
    @Req() req: any,
    @Query('days') days?: string,
  ): Promise<TaxDeadline[]> {
    const organizationId = req.user?.organisationId;
    if (!organizationId) {
      throw new BadRequestException('Organization ID not found in request');
    }

    const daysCount = days ? parseInt(days, 10) : 30;

    if (isNaN(daysCount) || daysCount < 1 || daysCount > 365) {
      throw new BadRequestException('Days parameter must be between 1 and 365');
    }

    return this.taxCalendarService.getUpcomingDeadlines(organizationId, daysCount);
  }

  /**
   * Get overdue deadlines
   * GET /tax/calendar/overdue
   */
  @Get('overdue')
  async getOverdue(@Req() req: any): Promise<TaxDeadline[]> {
    const organizationId = req.user?.organisationId;
    if (!organizationId) {
      throw new BadRequestException('Organization ID not found in request');
    }

    return this.taxCalendarService.getOverdueDeadlines(organizationId);
  }

  /**
   * Get deadlines with filters
   * GET /tax/calendar/filter?year=2024&type=vat_return&status=upcoming
   */
  @Get('filter')
  async getFiltered(
    @Req() req: any,
    @Query('year') year?: string,
    @Query('type') type?: TaxDeadlineType,
    @Query('status') status?: TaxDeadlineStatus,
    @Query('country') country?: string,
  ): Promise<TaxDeadline[]> {
    const organizationId = req.user?.organisationId;
    if (!organizationId) {
      throw new BadRequestException('Organization ID not found in request');
    }

    const filters: TaxCalendarFilters = {};

    if (year) {
      const targetYear = parseInt(year, 10);
      if (isNaN(targetYear) || targetYear < 2000 || targetYear > 2100) {
        throw new BadRequestException('Invalid year parameter');
      }
      filters.year = targetYear;
    }

    if (type) {
      const validTypes: TaxDeadlineType[] = [
        'vat_return',
        'income_tax',
        'prepayment',
        'annual_return',
        'custom',
      ];
      if (!validTypes.includes(type)) {
        throw new BadRequestException(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
      }
      filters.type = type;
    }

    if (status) {
      const validStatuses: TaxDeadlineStatus[] = ['upcoming', 'due_soon', 'overdue', 'completed'];
      if (!validStatuses.includes(status)) {
        throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
      filters.status = status;
    }

    if (country) {
      filters.country = country.toUpperCase();
    }

    return this.taxCalendarService.getDeadlinesByFilters(organizationId, filters);
  }

  /**
   * Get deadlines summary
   * GET /tax/calendar/summary
   */
  @Get('summary')
  async getSummary(@Req() req: any): Promise<{
    total: number;
    upcoming: number;
    dueSoon: number;
    overdue: number;
    completed: number;
    nextDeadline?: TaxDeadline;
  }> {
    const organizationId = req.user?.organisationId;
    if (!organizationId) {
      throw new BadRequestException('Organization ID not found in request');
    }

    const allDeadlines = await this.taxCalendarService.getDeadlines(organizationId);
    const now = new Date();

    const summary = {
      total: allDeadlines.length,
      upcoming: allDeadlines.filter(d => d.status === 'upcoming').length,
      dueSoon: allDeadlines.filter(d => d.status === 'due_soon').length,
      overdue: allDeadlines.filter(d => d.status === 'overdue').length,
      completed: allDeadlines.filter(d => d.status === 'completed').length,
      nextDeadline: allDeadlines
        .filter(d => d.dueDate >= now && d.status !== 'completed')
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0],
    };

    return summary;
  }

  /**
   * Get tax deadline reminders
   * GET /tax/calendar/reminders
   * Returns active reminders for upcoming deadlines at key intervals (30, 14, 7, 3, 1 days)
   */
  @Get('reminders')
  async getReminders(@Req() req: any) {
    const organizationId = req.user?.organisationId;
    if (!organizationId) {
      throw new BadRequestException('Organization ID not found in request');
    }

    return this.taxDeadlineService.generateReminders(organizationId);
  }

  /**
   * Get deadline statistics
   * GET /tax/calendar/stats
   * Returns summary statistics about tax deadlines
   */
  @Get('stats')
  async getStats(@Req() req: any) {
    const organizationId = req.user?.organisationId;
    if (!organizationId) {
      throw new BadRequestException('Organization ID not found in request');
    }

    return this.taxDeadlineService.getDeadlineSummary(organizationId);
  }
}
