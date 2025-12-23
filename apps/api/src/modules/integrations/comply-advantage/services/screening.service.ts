import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/modules/database/prisma.service';
import axios, { AxiosInstance, AxiosError } from 'axios';
import * as https from 'https';
import {
  SearchRequest,
  SearchResponse,
  SearchType,
  MatchType,
  RiskLevel,
  ScreeningStatus,
  ComplyAdvantageConfig,
  ScreeningHit,
} from '../types/comply-advantage.types';
import { CreateSearchDto } from '../dto/create-search.dto';
import { ComplyAdvantageEncryptionUtil } from '../utils/comply-advantage-encryption.util';

/**
 * ComplyAdvantage Screening Service
 * Handles PEP, sanctions, and watchlist screening
 */
@Injectable()
export class ScreeningService {
  private readonly logger = new Logger(ScreeningService.name);
  private readonly config: ComplyAdvantageConfig;
  private readonly httpClient: AxiosInstance;
  private readonly encryptionKey: string;
  private isConfigured: boolean = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Load configuration
    this.config = {
      apiKey: this.configService.get<string>('COMPLY_ADVANTAGE_API_KEY') || '',
      apiUrl: this.configService.get<string>('COMPLY_ADVANTAGE_API_URL') || 'https://api.complyadvantage.com',
      webhookSecret: this.configService.get<string>('COMPLY_ADVANTAGE_WEBHOOK_SECRET'),
      environment: (this.configService.get<string>('COMPLY_ADVANTAGE_ENVIRONMENT') || 'sandbox') as 'production' | 'sandbox',
      mockMode: this.configService.get<string>('COMPLY_ADVANTAGE_MOCK_MODE') === 'true',
      timeout: 30000,
    };

    // Get encryption key
    this.encryptionKey = this.configService.get<string>('COMPLY_ADVANTAGE_ENCRYPTION_KEY') ||
                         this.configService.get<string>('JWT_SECRET') || '';

    // Validate configuration
    if (!this.config.mockMode) {
      if (!this.config.apiKey) {
        this.logger.warn('ComplyAdvantage service is disabled - COMPLY_ADVANTAGE_API_KEY not configured');
        return;
      }
      if (!ComplyAdvantageEncryptionUtil.validateMasterKey(this.encryptionKey)) {
        this.logger.warn('ComplyAdvantage service is disabled - Invalid or missing encryption key');
        return;
      }
    }

    // Initialize HTTP client with TLS 1.3
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

    // Add request/response interceptors
    this.setupInterceptors();

    // Mark as configured
    this.isConfigured = true;
    this.logger.log('ComplyAdvantage Screening Service initialized');
  }

  /**
   * Setup axios interceptors for logging and error handling
   */
  private setupInterceptors(): void {
    this.httpClient.interceptors.request.use((config) => {
      const requestId = ComplyAdvantageEncryptionUtil.generateId();
      config.headers['X-Request-ID'] = requestId;
      this.logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, { requestId });
      return config;
    });

    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.debug('API Response successful', {
          status: response.status,
          requestId: response.config.headers['X-Request-ID'],
        });
        return response;
      },
      (error: AxiosError) => {
        this.logger.error('API Request failed', {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
        });
        throw error;
      },
    );
  }

  /**
   * Create AML screening search
   */
  async createSearch(dto: CreateSearchDto): Promise<any> {
    if (!this.isConfigured) {
      throw new BadRequestException('ComplyAdvantage service is not configured. Please configure COMPLY_ADVANTAGE_API_KEY environment variable.');
    }

    try {
      this.logger.log('Creating AML screening search', {
        searchTerm: dto.searchTerm,
        searchType: dto.searchType,
        organisationId: dto.organisationId,
      });

      // Build search request
      const searchRequest: SearchRequest = {
        search_term: dto.searchTerm,
        search_type: dto.searchType,
        filters: {
          types: dto.matchTypes,
          birth_year: dto.birthYear,
          country_codes: dto.countryCode ? [dto.countryCode] : undefined,
          remove_deceased: dto.removeDeceased,
        },
        exact_match: dto.exactMatch,
        fuzziness: dto.fuzziness,
        client_ref: `${dto.organisationId}-${Date.now()}`,
      };

      // Call ComplyAdvantage API
      let searchResponse: SearchResponse;

      if (this.config.mockMode) {
        searchResponse = this.generateMockSearchResponse(searchRequest);
      } else {
        const response = await this.httpClient.post<SearchResponse>('/searches', searchRequest);
        searchResponse = response.data;
      }

      // Calculate risk level based on matches
      const riskLevel = this.calculateRiskLevel(searchResponse);
      const status = this.determineStatus(searchResponse);

      // Save to database
      const screening = await this.prisma.amlScreening.create({
        data: {
          searchId: searchResponse.id,
          entityType: dto.searchType,
          entityName: dto.searchTerm,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          countryCode: dto.countryCode,
          userId: dto.userId,
          organisationId: dto.organisationId,
          riskLevel,
          matchCount: searchResponse.total_hits,
          status,
          lastScreenedAt: new Date(),
          nextReviewAt: this.calculateNextReviewDate(riskLevel),
          metadata: {
            searchRef: searchResponse.ref,
            filters: searchRequest.filters,
          },
        },
      });

      // Create alerts for each match
      if (searchResponse.total_hits > 0) {
        await this.createAlertsFromHits(screening.id, searchResponse.data.hits);
      }

      // Log audit entry
      await this.logAuditEntry({
        action: 'search_created',
        organisationId: dto.organisationId,
        userId: dto.userId,
        metadata: {
          screeningId: screening.id,
          searchId: searchResponse.id,
          matchCount: searchResponse.total_hits,
          riskLevel,
        },
      });

      this.logger.log('AML screening search created', {
        screeningId: screening.id,
        matchCount: searchResponse.total_hits,
        riskLevel,
      });

      return screening;
    } catch (error) {
      this.logger.error('Failed to create screening search', error);
      if (error instanceof AxiosError) {
        throw new BadRequestException(
          `ComplyAdvantage API error: ${error.response?.data?.message || error.message}`,
        );
      }
      throw new InternalServerErrorException('Failed to create screening search');
    }
  }

  /**
   * Get screening by ID
   */
  async getScreening(screeningId: string): Promise<any> {
    if (!this.isConfigured) {
      throw new BadRequestException('ComplyAdvantage service is not configured. Please configure COMPLY_ADVANTAGE_API_KEY environment variable.');
    }

    const screening = await this.prisma.amlScreening.findUnique({
      where: { id: screeningId },
      include: {
        alerts: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!screening) {
      throw new BadRequestException('Screening not found');
    }

    return screening;
  }

  /**
   * List screenings for organization
   */
  async listScreenings(organisationId: string, filters?: any): Promise<any> {
    if (!this.isConfigured) {
      throw new BadRequestException('ComplyAdvantage service is not configured. Please configure COMPLY_ADVANTAGE_API_KEY environment variable.');
    }

    const where: any = { organisationId };

    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.riskLevel) {
      where.riskLevel = filters.riskLevel;
    }

    const screenings = await this.prisma.amlScreening.findMany({
      where,
      include: {
        alerts: {
          where: { status: 'open' },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit ? parseInt(filters.limit) : 50,
      skip: filters?.offset ? parseInt(filters.offset) : 0,
    });

    return screenings;
  }

  /**
   * Re-screen an existing entity
   */
  async reScreen(screeningId: string): Promise<any> {
    if (!this.isConfigured) {
      throw new BadRequestException('ComplyAdvantage service is not configured. Please configure COMPLY_ADVANTAGE_API_KEY environment variable.');
    }

    const existingScreening = await this.getScreening(screeningId);

    // Create new search with same parameters
    const dto: CreateSearchDto = {
      searchTerm: existingScreening.entityName,
      searchType: existingScreening.entityType as SearchType,
      dateOfBirth: existingScreening.dateOfBirth?.toISOString(),
      countryCode: existingScreening.countryCode || undefined,
      organisationId: existingScreening.organisationId,
      userId: existingScreening.userId || undefined,
    };

    return this.createSearch(dto);
  }

  /**
   * Create alerts from screening hits
   */
  private async createAlertsFromHits(screeningId: string, hits: ScreeningHit[]): Promise<void> {
    const alerts = hits.map((hit) => {
      const primarySource = hit.sources[0];
      return {
        screeningId,
        alertType: hit.match_types[0] || 'unknown',
        matchName: hit.entity.name,
        matchScore: hit.score,
        sourceList: primarySource?.name || 'unknown',
        sourceUrl: primarySource?.url,
        status: 'open',
      };
    });

    await this.prisma.amlAlert.createMany({
      data: alerts,
    });
  }

  /**
   * Calculate risk level based on search results
   */
  private calculateRiskLevel(searchResponse: SearchResponse): RiskLevel {
    if (searchResponse.total_hits === 0) {
      return RiskLevel.LOW;
    }

    // Check for high-risk match types
    const hasHighRiskMatch = searchResponse.data.hits.some((hit) =>
      hit.match_types.includes(MatchType.SANCTION) ||
      hit.match_types.includes(MatchType.PEP),
    );

    // Check match scores
    const maxScore = Math.max(...searchResponse.data.hits.map((h) => h.score));

    if (hasHighRiskMatch && maxScore >= 90) {
      return RiskLevel.CRITICAL;
    } else if (hasHighRiskMatch || maxScore >= 75) {
      return RiskLevel.HIGH;
    } else if (maxScore >= 50) {
      return RiskLevel.MEDIUM;
    }

    return RiskLevel.LOW;
  }

  /**
   * Determine screening status
   */
  private determineStatus(searchResponse: SearchResponse): ScreeningStatus {
    if (searchResponse.total_hits === 0) {
      return ScreeningStatus.CLEAR;
    }

    const maxScore = Math.max(...searchResponse.data.hits.map((h) => h.score));

    if (maxScore >= 75) {
      return ScreeningStatus.PENDING_REVIEW;
    }

    return ScreeningStatus.POTENTIAL_MATCH;
  }

  /**
   * Calculate next review date based on risk level
   */
  private calculateNextReviewDate(riskLevel: RiskLevel): Date {
    const now = new Date();

    switch (riskLevel) {
      case RiskLevel.CRITICAL:
        // Review in 7 days
        return new Date(now.setDate(now.getDate() + 7));
      case RiskLevel.HIGH:
        // Review in 30 days
        return new Date(now.setDate(now.getDate() + 30));
      case RiskLevel.MEDIUM:
        // Review in 90 days
        return new Date(now.setDate(now.getDate() + 90));
      default:
        // Review in 365 days
        return new Date(now.setDate(now.getDate() + 365));
    }
  }

  /**
   * Log audit entry
   */
  private async logAuditEntry(entry: any): Promise<void> {
    // Implementation depends on your audit log system
    this.logger.log('Audit log entry', entry);
  }

  /**
   * Generate mock search response for testing
   */
  private generateMockSearchResponse(request: SearchRequest): SearchResponse {
    const hasMatch = Math.random() > 0.7; // 30% chance of match

    return {
      id: `search_${ComplyAdvantageEncryptionUtil.generateId()}`,
      ref: request.client_ref || 'mock-ref',
      searcher_id: 'mock-searcher',
      search_term: request.search_term,
      filters: request.filters || {},
      match_status: hasMatch ? 'potential_match' : 'no_match',
      total_hits: hasMatch ? 1 : 0,
      data: {
        hits: hasMatch ? [{
          id: `hit_${ComplyAdvantageEncryptionUtil.generateId()}`,
          match_types: [MatchType.PEP],
          match_status: 'potential',
          score: 85,
          entity: {
            id: `entity_${ComplyAdvantageEncryptionUtil.generateId()}`,
            name: request.search_term,
            aliases: [],
          },
          sources: [{
            name: 'Mock PEP Database',
            types: [MatchType.PEP],
            aml_types: ['pep-class-1'],
            url: 'https://example.com/mock-source',
          }],
          fields: [],
        }] : [],
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}
