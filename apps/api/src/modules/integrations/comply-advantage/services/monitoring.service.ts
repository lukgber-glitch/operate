import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/modules/database/prisma.service';
import axios, { AxiosInstance } from 'axios';
import * as https from 'https';
import {
  MonitoringRequest,
  MonitoringResponse,
  MonitoringFrequency,
  ComplyAdvantageConfig,
} from '../types/comply-advantage.types';
import { CreateMonitoringDto } from '../dto/webhook-payload.dto';
import { ComplyAdvantageEncryptionUtil } from '../utils/comply-advantage-encryption.util';

/**
 * ComplyAdvantage Monitoring Service
 * Handles ongoing monitoring of screened entities
 */
@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly config: ComplyAdvantageConfig;
  private readonly httpClient: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Load configuration
    this.config = {
      apiKey: this.configService.get<string>('COMPLY_ADVANTAGE_API_KEY') || '',
      apiUrl: this.configService.get<string>('COMPLY_ADVANTAGE_API_URL') || 'https://api.complyadvantage.com',
      environment: (this.configService.get<string>('COMPLY_ADVANTAGE_ENVIRONMENT') || 'sandbox') as 'production' | 'sandbox',
      mockMode: this.configService.get<string>('COMPLY_ADVANTAGE_MOCK_MODE') === 'true',
      timeout: 30000,
    };

    // Initialize HTTP client
    this.httpClient = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'User-Agent': 'Operate-CoachOS/1.0',
      },
      httpsAgent: new https.Agent({
        minVersion: 'TLSv1.3',
        rejectUnauthorized: true,
      }),
    });
  }

  /**
   * Enable ongoing monitoring for a screening
   */
  async enableMonitoring(dto: CreateMonitoringDto): Promise<any> {
    try {
      this.logger.log('Enabling ongoing monitoring', {
        screeningId: dto.screeningId,
        frequency: dto.frequency,
      });

      // Get screening
      const screening = await this.prisma.amlScreening.findUnique({
        where: { id: dto.screeningId },
      });

      if (!screening) {
        throw new BadRequestException('Screening not found');
      }

      // Check if monitoring already exists
      const existingMonitoring = await this.prisma.amlMonitoring.findFirst({
        where: {
          screeningId: dto.screeningId,
          isActive: true,
        },
      });

      if (existingMonitoring) {
        throw new BadRequestException('Monitoring already enabled for this screening');
      }

      // Build monitoring request
      const monitoringRequest: MonitoringRequest = {
        search_id: screening.searchId,
        frequency: dto.frequency as MonitoringFrequency,
      };

      // Call ComplyAdvantage API
      let monitoringResponse: MonitoringResponse;

      if (this.config.mockMode) {
        monitoringResponse = this.generateMockMonitoringResponse(monitoringRequest);
      } else {
        const response = await this.httpClient.post<MonitoringResponse>(
          '/monitoring',
          monitoringRequest,
        );
        monitoringResponse = response.data;
      }

      // Calculate next check date
      const nextCheckAt = this.calculateNextCheckDate(dto.frequency);

      // Save to database
      const monitoring = await this.prisma.amlMonitoring.create({
        data: {
          screeningId: dto.screeningId,
          monitoringId: monitoringResponse.id,
          frequency: dto.frequency,
          isActive: true,
          lastCheckedAt: new Date(),
          nextCheckAt,
        },
      });

      this.logger.log('Monitoring enabled', {
        monitoringId: monitoring.id,
        screeningId: dto.screeningId,
        frequency: dto.frequency,
      });

      return monitoring;
    } catch (error) {
      this.logger.error('Failed to enable monitoring', error);
      throw new InternalServerErrorException('Failed to enable monitoring');
    }
  }

  /**
   * Disable monitoring for a screening
   */
  async disableMonitoring(screeningId: string): Promise<void> {
    try {
      this.logger.log('Disabling monitoring', { screeningId });

      const monitoring = await this.prisma.amlMonitoring.findFirst({
        where: {
          screeningId,
          isActive: true,
        },
      });

      if (!monitoring) {
        throw new BadRequestException('No active monitoring found for this screening');
      }

      // Call ComplyAdvantage API to stop monitoring
      if (!this.config.mockMode) {
        await this.httpClient.delete(`/monitoring/${monitoring.monitoringId}`);
      }

      // Update database
      await this.prisma.amlMonitoring.update({
        where: { id: monitoring.id },
        data: {
          isActive: false,
        },
      });

      this.logger.log('Monitoring disabled', { screeningId });
    } catch (error) {
      this.logger.error('Failed to disable monitoring', error);
      throw new InternalServerErrorException('Failed to disable monitoring');
    }
  }

  /**
   * Get monitoring status for a screening
   */
  async getMonitoringStatus(screeningId: string): Promise<any> {
    const monitoring = await this.prisma.amlMonitoring.findFirst({
      where: {
        screeningId,
        isActive: true,
      },
    });

    return monitoring;
  }

  /**
   * List all active monitoring
   */
  async listActiveMonitoring(organisationId: string): Promise<any> {
    const monitoringRecords = await this.prisma.amlMonitoring.findMany({
      where: {
        isActive: true,
        screening: {
          organisationId,
        },
      },
      include: {
        screening: {
          include: {
            alerts: {
              where: { status: 'open' },
            },
          },
        },
      },
      orderBy: { nextCheckAt: 'asc' },
    });

    return monitoringRecords;
  }

  /**
   * Process monitoring update (called by webhook or scheduled job)
   */
  async processMonitoringUpdate(searchId: string, newHits: any[]): Promise<void> {
    try {
      this.logger.log('Processing monitoring update', {
        searchId,
        newHitsCount: newHits.length,
      });

      // Find screening
      const screening = await this.prisma.amlScreening.findUnique({
        where: { searchId },
      });

      if (!screening) {
        this.logger.warn('Screening not found for monitoring update', { searchId });
        return;
      }

      // Create alerts for new hits
      if (newHits.length > 0) {
        const alerts = newHits.map((hit) => ({
          screeningId: screening.id,
          alertType: hit.match_types?.[0] || 'unknown',
          matchName: hit.entity?.name || 'Unknown',
          matchScore: hit.score || 0,
          sourceList: hit.sources?.[0]?.name || 'unknown',
          sourceUrl: hit.sources?.[0]?.url,
          status: 'open',
        }));

        await this.prisma.amlAlert.createMany({
          data: alerts,
        });

        // Update screening
        await this.prisma.amlScreening.update({
          where: { id: screening.id },
          data: {
            matchCount: { increment: newHits.length },
            status: 'pending_review',
            lastScreenedAt: new Date(),
          },
        });

        this.logger.log('Monitoring update processed', {
          screeningId: screening.id,
          newAlertsCount: alerts.length,
        });
      }

      // Update monitoring record
      await this.prisma.amlMonitoring.updateMany({
        where: {
          screeningId: screening.id,
          isActive: true,
        },
        data: {
          lastCheckedAt: new Date(),
          nextCheckAt: this.calculateNextCheckDate(
            (await this.getMonitoringStatus(screening.id))?.frequency || 'weekly',
          ),
        },
      });
    } catch (error) {
      this.logger.error('Failed to process monitoring update', error);
      throw error;
    }
  }

  /**
   * Calculate next check date based on frequency
   */
  private calculateNextCheckDate(frequency: string): Date {
    const now = new Date();

    switch (frequency) {
      case 'daily':
        return new Date(now.setDate(now.getDate() + 1));
      case 'weekly':
        return new Date(now.setDate(now.getDate() + 7));
      case 'monthly':
        return new Date(now.setMonth(now.getMonth() + 1));
      default:
        return new Date(now.setDate(now.getDate() + 7));
    }
  }

  /**
   * Generate mock monitoring response for testing
   */
  private generateMockMonitoringResponse(request: MonitoringRequest): MonitoringResponse {
    return {
      id: `mon_${ComplyAdvantageEncryptionUtil.generateId()}`,
      search_id: request.search_id,
      status: 'active',
      frequency: request.frequency,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}
