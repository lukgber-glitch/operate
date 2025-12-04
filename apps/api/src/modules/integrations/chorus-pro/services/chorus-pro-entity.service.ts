import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ChorusProAuthService } from './chorus-pro-auth.service';
import {
  ChorusProEntityLookupRequest,
  ChorusProEntityLookupResponse,
  ChorusProServiceInfo,
  ChorusProDocumentFormat,
  ChorusProApiConfig,
} from '../types/chorus-pro.types';

/**
 * Chorus Pro Entity Service
 *
 * Handles public entity lookup and service code resolution.
 *
 * Features:
 * - Lookup public entities by SIRET
 * - Retrieve service codes for entities
 * - Check if entity accepts electronic invoices
 * - Get entity requirements (engagement, format, etc.)
 * - Cache entity information
 *
 * French Public Entities:
 * - Ministries and government departments
 * - Local authorities (communes, départements, régions)
 * - Public hospitals (AP-HP, CHU, etc.)
 * - Public establishments (EPA, EPIC, etc.)
 * - Social security organizations
 */
@Injectable()
export class ChorusProEntityService {
  private readonly logger = new Logger(ChorusProEntityService.name);
  private readonly httpClient: AxiosInstance;
  private readonly apiConfig: ChorusProApiConfig;
  private readonly entityCache: Map<
    string,
    { entity: ChorusProEntityLookupResponse; timestamp: number }
  > = new Map();
  private readonly cacheTTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: ChorusProAuthService,
  ) {
    // Load API configuration
    this.apiConfig = {
      baseUrl:
        this.configService.get<string>('CHORUS_PRO_API_URL') ||
        'https://chorus-pro.gouv.fr/cpro/transverses',
      version: this.configService.get<string>('CHORUS_PRO_API_VERSION') || 'v1',
      timeout:
        this.configService.get<number>('CHORUS_PRO_API_TIMEOUT') || 60000,
      retryAttempts:
        this.configService.get<number>('CHORUS_PRO_RETRY_ATTEMPTS') || 3,
      retryDelay:
        this.configService.get<number>('CHORUS_PRO_RETRY_DELAY') || 1000,
    };

    // Create HTTP client
    this.httpClient = axios.create({
      baseURL: this.apiConfig.baseUrl,
      timeout: this.apiConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CoachOS-ChorusPro/1.0',
      },
    });

    // Add request interceptor for authentication
    this.httpClient.interceptors.request.use(async (config) => {
      const token = await this.authService.getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // Add response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          this.logger.warn('Token expired, refreshing...');
          this.authService.invalidateToken();
          const token = await this.authService.getAccessToken();
          error.config.headers.Authorization = `Bearer ${token}`;
          return this.httpClient.request(error.config);
        }
        return Promise.reject(error);
      },
    );

    this.logger.log('Chorus Pro Entity Service initialized');
  }

  /**
   * Lookup public entity by SIRET
   */
  async lookupEntity(
    request: ChorusProEntityLookupRequest,
  ): Promise<ChorusProEntityLookupResponse> {
    try {
      // Check cache first
      const cached = this.getFromCache(request.siret);
      if (cached) {
        this.logger.debug(`Using cached entity data for SIRET ${request.siret}`);
        return cached;
      }

      this.logger.log(`Looking up public entity with SIRET ${request.siret}`);

      const response = await this.httpClient.get(
        `/structures/${this.apiConfig.version}/rechercher`,
        {
          params: {
            siret: request.siret,
            nom: request.name,
          },
        },
      );

      const result = this.parseEntityLookupResponse(response.data);

      // Cache the result
      if (result.success) {
        this.cacheEntity(request.siret, result);
      }

      this.logger.log(
        `Entity lookup for ${request.siret}: ${result.success ? 'found' : 'not found'}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to lookup entity ${request.siret}: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        error: `Entity lookup failed: ${error.message}`,
      };
    }
  }

  /**
   * Get service codes for an entity
   */
  async getServiceCodes(siret: string): Promise<ChorusProServiceInfo[]> {
    const entity = await this.lookupEntity({ siret });

    if (!entity.success || !entity.entity) {
      return [];
    }

    return entity.entity.services || [];
  }

  /**
   * Check if entity accepts electronic invoices
   */
  async acceptsEInvoices(siret: string): Promise<boolean> {
    const entity = await this.lookupEntity({ siret });

    if (!entity.success || !entity.entity) {
      return false;
    }

    return entity.entity.acceptsInvoices;
  }

  /**
   * Check if entity is registered in Chorus Pro
   */
  async isRegistered(siret: string): Promise<boolean> {
    const entity = await this.lookupEntity({ siret });

    if (!entity.success || !entity.entity) {
      return false;
    }

    return entity.entity.isRegistered;
  }

  /**
   * Get accepted document formats for an entity
   */
  async getAcceptedFormats(
    siret: string,
    serviceCode?: string,
  ): Promise<ChorusProDocumentFormat[]> {
    const services = await this.getServiceCodes(siret);

    if (serviceCode) {
      const service = services.find((s) => s.serviceCode === serviceCode);
      return service?.acceptedFormats || [ChorusProDocumentFormat.FACTURX];
    }

    // Return union of all accepted formats
    const allFormats = new Set<ChorusProDocumentFormat>();
    services.forEach((service) => {
      service.acceptedFormats?.forEach((format) => allFormats.add(format));
    });

    return Array.from(allFormats);
  }

  /**
   * Check if service requires engagement number
   */
  async requiresEngagement(
    siret: string,
    serviceCode: string,
  ): Promise<boolean> {
    const services = await this.getServiceCodes(siret);
    const service = services.find((s) => s.serviceCode === serviceCode);
    return service?.requiresEngagement || false;
  }

  /**
   * Validate SIRET and service code combination
   */
  async validateServiceCode(
    siret: string,
    serviceCode: string,
  ): Promise<boolean> {
    const services = await this.getServiceCodes(siret);
    return services.some(
      (s) => s.serviceCode === serviceCode && s.isActive,
    );
  }

  /**
   * Search entities by name
   */
  async searchEntities(name: string): Promise<ChorusProEntityLookupResponse[]> {
    try {
      this.logger.log(`Searching entities with name: ${name}`);

      const response = await this.httpClient.get(
        `/structures/${this.apiConfig.version}/rechercher`,
        {
          params: {
            nom: name,
          },
        },
      );

      const entities = Array.isArray(response.data.structures)
        ? response.data.structures
        : [response.data];

      return entities.map((data: any) => this.parseEntityLookupResponse(data));
    } catch (error) {
      this.logger.error(
        `Failed to search entities: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Clear entity cache
   */
  clearCache(siret?: string): void {
    if (siret) {
      this.entityCache.delete(siret);
      this.logger.log(`Cleared cache for SIRET ${siret}`);
    } else {
      this.entityCache.clear();
      this.logger.log('Cleared entire entity cache');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    entries: Array<{ siret: string; age: number }>;
  } {
    const entries = Array.from(this.entityCache.entries()).map(
      ([siret, data]) => ({
        siret,
        age: Date.now() - data.timestamp,
      }),
    );

    return {
      size: this.entityCache.size,
      entries,
    };
  }

  /**
   * Parse entity lookup response
   */
  private parseEntityLookupResponse(
    data: any,
  ): ChorusProEntityLookupResponse {
    if (!data || data.codeRetour === '1' || data.found === false) {
      return {
        success: false,
        error: data?.message || 'Entity not found',
      };
    }

    return {
      success: true,
      entity: {
        siret: data.siret,
        name: data.nom || data.name,
        structureId: data.identifiantStructure || data.structureId,
        services: this.parseServiceList(data.services || data.codeServices || []),
        isRegistered: data.inscrit !== false && data.registered !== false,
        acceptsInvoices:
          data.accepteFactures !== false && data.acceptsInvoices !== false,
      },
    };
  }

  /**
   * Parse service list
   */
  private parseServiceList(data: any[]): ChorusProServiceInfo[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((service) => ({
      serviceCode: service.codeService || service.code,
      serviceName: service.nomService || service.name || '',
      isActive: service.actif !== false && service.active !== false,
      requiresEngagement:
        service.engagementObligatoire === true ||
        service.requiresEngagement === true,
      acceptedFormats: this.parseAcceptedFormats(
        service.formatsAcceptes || service.acceptedFormats,
      ),
    }));
  }

  /**
   * Parse accepted formats
   */
  private parseAcceptedFormats(formats: any): ChorusProDocumentFormat[] {
    if (!formats) {
      return [ChorusProDocumentFormat.FACTURX]; // Default
    }

    if (Array.isArray(formats)) {
      return formats
        .map((f) => this.mapDocumentFormat(f))
        .filter((f): f is ChorusProDocumentFormat => f !== null);
    }

    return [ChorusProDocumentFormat.FACTURX];
  }

  /**
   * Map document format string to enum
   */
  private mapDocumentFormat(format: string): ChorusProDocumentFormat | null {
    const formatMap: Record<string, ChorusProDocumentFormat> = {
      FACTURX: ChorusProDocumentFormat.FACTURX,
      'FACTUR-X': ChorusProDocumentFormat.FACTURX,
      PDF: ChorusProDocumentFormat.PDF,
      UBL: ChorusProDocumentFormat.UBL,
      CII: ChorusProDocumentFormat.CII,
    };

    return formatMap[format?.toUpperCase()] || null;
  }

  /**
   * Get entity from cache
   */
  private getFromCache(siret: string): ChorusProEntityLookupResponse | null {
    const cached = this.entityCache.get(siret);

    if (!cached) {
      return null;
    }

    // Check if cache is still valid
    const age = Date.now() - cached.timestamp;
    if (age > this.cacheTTL) {
      this.entityCache.delete(siret);
      return null;
    }

    return cached.entity;
  }

  /**
   * Cache entity lookup result
   */
  private cacheEntity(
    siret: string,
    entity: ChorusProEntityLookupResponse,
  ): void {
    this.entityCache.set(siret, {
      entity,
      timestamp: Date.now(),
    });
  }
}
