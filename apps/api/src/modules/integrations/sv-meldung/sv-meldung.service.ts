import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import { RedisService } from '../../cache/redis.service';
import { DeuevBuilder } from './utils/deuev-builder.util';
import { SvValidator } from './utils/sv-validator.util';
import { SvAnmeldungDto } from './dto/sv-anmeldung.dto';
import { SvAbmeldungDto } from './dto/sv-abmeldung.dto';
import { SvAenderungDto } from './dto/sv-aenderung.dto';
import {
  SvResponse,
  SvResponseStatus,
  ErrorSeverity,
  BatchSubmissionResult,
  CachedSubmission,
} from './interfaces/sv-response.interface';
import {
  DeuevMessage,
  DsmeRecord,
  DskkRecord,
  Abgabegrund,
  DeuevMessageType,
} from './interfaces/deuev-message.interface';
import { SvMeldungConfig } from './interfaces/sv-config.interface';
import {
  GERMAN_HEALTH_CARRIERS,
  HealthCarrier,
} from './interfaces/sv-carrier.interface';

/**
 * SV-Meldung Service
 * Handles German social security reporting (Sozialversicherungsmeldungen)
 */
@Injectable()
export class SvMeldungService {
  private readonly logger = new Logger(SvMeldungService.name);
  private readonly deuevBuilder = new DeuevBuilder();
  private readonly cachePrefix = 'sv-meldung';
  private readonly cacheTtl = 30 * 24 * 60 * 60; // 30 days in seconds

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create Anmeldung (Registration)
   */
  async createAnmeldung(
    data: SvAnmeldungDto,
  ): Promise<SvResponse> {
    this.logger.log(
      `Creating SV-Anmeldung for employee ${data.employeeId}`,
    );

    try {
      // Validate input data
      this.validateAnmeldungData(data);

      // Build DEÜV message
      const deuevMessage = await this.buildAnmeldungMessage(data);

      // Generate submission
      const response = await this.submitMessage(
        deuevMessage,
        'ANMELDUNG',
        data.employeeId,
        data.krankenkasseIk,
        data.autoSubmit || false,
      );

      // Cache submission
      await this.cacheSubmission(response, data.employeeId);

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to create SV-Anmeldung: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Create Abmeldung (Deregistration)
   */
  async createAbmeldung(
    data: SvAbmeldungDto,
  ): Promise<SvResponse> {
    this.logger.log(
      `Creating SV-Abmeldung for employee ${data.employeeId}`,
    );

    try {
      // Validate input data
      this.validateAbmeldungData(data);

      // Build DEÜV message
      const deuevMessage = await this.buildAbmeldungMessage(data);

      // Generate submission
      const response = await this.submitMessage(
        deuevMessage,
        'ABMELDUNG',
        data.employeeId,
        data.krankenkasseIk || '',
        data.autoSubmit || false,
      );

      // Cache submission
      await this.cacheSubmission(response, data.employeeId);

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to create SV-Abmeldung: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Create Änderung (Change notification)
   */
  async createAenderung(
    data: SvAenderungDto,
  ): Promise<SvResponse> {
    this.logger.log(
      `Creating SV-Änderung for employee ${data.employeeId}`,
    );

    try {
      // Validate input data
      this.validateAenderungData(data);

      // Build DEÜV message
      const deuevMessage = await this.buildAenderungMessage(data);

      // Generate submission
      const response = await this.submitMessage(
        deuevMessage,
        'AENDERUNG',
        data.employeeId,
        data.neueKrankenkasseIk || '',
        data.autoSubmit || false,
      );

      // Cache submission
      await this.cacheSubmission(response, data.employeeId);

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to create SV-Änderung: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate DEÜV message (without submission)
   */
  async generateDeuevMessage(
    type: 'ANMELDUNG' | 'ABMELDUNG' | 'AENDERUNG',
    data: SvAnmeldungDto | SvAbmeldungDto | SvAenderungDto,
  ): Promise<string> {
    let message: DeuevMessage;

    switch (type) {
      case 'ANMELDUNG':
        message = await this.buildAnmeldungMessage(
          data as SvAnmeldungDto,
        );
        break;
      case 'ABMELDUNG':
        message = await this.buildAbmeldungMessage(
          data as SvAbmeldungDto,
        );
        break;
      case 'AENDERUNG':
        message = await this.buildAenderungMessage(
          data as SvAenderungDto,
        );
        break;
      default:
        throw new BadRequestException(`Invalid message type: ${type}`);
    }

    return this.deuevBuilder.buildMessage(message);
  }

  /**
   * Process carrier response
   */
  async processCarrierResponse(
    response: string,
  ): Promise<SvResponse> {
    this.logger.log('Processing carrier response');

    // Parse response (simplified - actual implementation would parse DEÜV response format)
    // This is a placeholder for actual carrier response parsing
    const parsed = this.parseCarrierResponse(response);

    return parsed;
  }

  /**
   * Get submission status
   */
  async getSubmissionStatus(
    submissionId: string,
  ): Promise<SvResponse | null> {
    const cacheKey = `${this.cachePrefix}:submission:${submissionId}`;
    return await this.redisService.get<SvResponse>(cacheKey);
  }

  /**
   * Get employee submissions
   */
  async getEmployeeSubmissions(
    employeeId: string,
  ): Promise<CachedSubmission[]> {
    const pattern = `${this.cachePrefix}:employee:${employeeId}:*`;
    const keys = await this.redisService.keys(pattern);

    const submissions: CachedSubmission[] = [];
    for (const key of keys) {
      const cached = await this.redisService.get<CachedSubmission>(key);
      if (cached) {
        submissions.push(cached);
      }
    }

    return submissions.sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() -
        new Date(a.submittedAt).getTime(),
    );
  }

  /**
   * Validate Anmeldung data
   */
  private validateAnmeldungData(data: SvAnmeldungDto): void {
    const errors: string[] = [];

    // Validate Betriebsnummer
    const bnResult = SvValidator.validateBetriebsnummer(
      data.betriebsnummer,
    );
    if (!bnResult.isValid) {
      errors.push(...bnResult.errors);
    }

    // Validate Versicherungsnummer
    const vnResult = SvValidator.validateVersicherungsnummer(
      data.versicherungsnummer,
    );
    if (!vnResult.isValid) {
      errors.push(...vnResult.errors);
    }

    // Validate IK
    const ikResult = SvValidator.validateIK(data.krankenkasseIk);
    if (!ikResult.isValid) {
      errors.push(...ikResult.errors);
    }

    // Validate Beitragsgruppen
    ['kv', 'rv', 'av', 'pv'].forEach((type) => {
      const result = SvValidator.validateBeitragsgruppe(
        type.toUpperCase() as any,
        data.beitragsgruppen[type],
      );
      if (!result.isValid) {
        errors.push(...result.errors);
      }
    });

    // Validate Personengruppe
    const pgResult = SvValidator.validatePersonengruppe(
      data.personengruppe,
    );
    if (!pgResult.isValid) {
      errors.push(...pgResult.errors);
    }

    // Validate PLZ
    const plzResult = SvValidator.validatePLZ(data.anschrift.plz);
    if (!plzResult.isValid) {
      errors.push(...plzResult.errors);
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }
  }

  /**
   * Validate Abmeldung data
   */
  private validateAbmeldungData(data: SvAbmeldungDto): void {
    const errors: string[] = [];

    // Validate Betriebsnummer
    const bnResult = SvValidator.validateBetriebsnummer(
      data.betriebsnummer,
    );
    if (!bnResult.isValid) {
      errors.push(...bnResult.errors);
    }

    // Validate Versicherungsnummer
    const vnResult = SvValidator.validateVersicherungsnummer(
      data.versicherungsnummer,
    );
    if (!vnResult.isValid) {
      errors.push(...vnResult.errors);
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }
  }

  /**
   * Validate Änderung data
   */
  private validateAenderungData(data: SvAenderungDto): void {
    const errors: string[] = [];

    // Validate Betriebsnummer
    const bnResult = SvValidator.validateBetriebsnummer(
      data.betriebsnummer,
    );
    if (!bnResult.isValid) {
      errors.push(...bnResult.errors);
    }

    // Validate Versicherungsnummer
    const vnResult = SvValidator.validateVersicherungsnummer(
      data.versicherungsnummer,
    );
    if (!vnResult.isValid) {
      errors.push(...vnResult.errors);
    }

    // Validate new IK if provided
    if (data.neueKrankenkasseIk) {
      const ikResult = SvValidator.validateIK(data.neueKrankenkasseIk);
      if (!ikResult.isValid) {
        errors.push(...ikResult.errors);
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }
  }

  /**
   * Build Anmeldung DEÜV message
   */
  private async buildAnmeldungMessage(
    data: SvAnmeldungDto,
  ): Promise<DeuevMessage> {
    const config = this.getConfig();

    const dsmeRecord: DsmeRecord = {
      satzart: 'DSME',
      betriebsnummer: data.betriebsnummer,
      versicherungsnummer: data.versicherungsnummer,
      nachname: data.nachname,
      vorname: data.vorname,
      geburtsdatum: data.geburtsdatum,
      geschlecht: data.geschlecht,
      staatsangehoerigkeit: data.staatsangehoerigkeit,
      anschrift: data.anschrift,
      abgabegrund: data.abgabegrund || Abgabegrund.BEGINN,
      zeitraumVon: data.beschaeftigungBeginn,
      beitragsgruppen: data.beitragsgruppen,
      entgelt: data.entgelt ? Math.round(data.entgelt * 100) : undefined,
      personengruppe: data.personengruppe,
      taetigkeitsschluessel: data.taetigkeitsschluessel,
    };

    const dskkRecord: DskkRecord = {
      satzart: 'DSKK',
      betriebsnummer: data.betriebsnummer,
      krankenkasseIk: data.krankenkasseIk,
      krankenkasseName:
        data.krankenkasseName ||
        this.getCarrierName(data.krankenkasseIk),
    };

    return {
      header: {
        version: config.deuev.version,
        absender: config.deuev.absender,
        erstellungsdatum: new Date().toISOString().split('T')[0],
        erstellungsuhrzeit: new Date()
          .toTimeString()
          .split(' ')[0]
          .replace(/:/g, ''),
        testkennung: config.deuev.testMode,
      },
      dsmeRecords: [dsmeRecord],
      dskkRecords: [dskkRecord],
      footer: {
        recordCount: 2, // DSME + DSKK
      },
    };
  }

  /**
   * Build Abmeldung DEÜV message
   */
  private async buildAbmeldungMessage(
    data: SvAbmeldungDto,
  ): Promise<DeuevMessage> {
    const config = this.getConfig();

    const dsmeRecord: DsmeRecord = {
      satzart: 'DSME',
      betriebsnummer: data.betriebsnummer,
      versicherungsnummer: data.versicherungsnummer,
      nachname: data.nachname,
      vorname: data.vorname,
      geburtsdatum: data.geburtsdatum,
      geschlecht: 'M', // Placeholder - would be fetched from employee data
      staatsangehoerigkeit: 'DEU', // Placeholder
      anschrift: {
        strasse: '',
        hausnummer: '',
        plz: '00000',
        ort: '',
      }, // Minimal for Abmeldung
      abgabegrund: data.abgabegrund || Abgabegrund.ENDE,
      zeitraumVon: data.beschaeftigungEnde,
      zeitraumBis: data.beschaeftigungEnde,
      beitragsgruppen: {
        kv: '0',
        rv: '0',
        av: '0',
        pv: '0',
      }, // End of employment
      personengruppe: '101', // Placeholder
    };

    return {
      header: {
        version: config.deuev.version,
        absender: config.deuev.absender,
        erstellungsdatum: new Date().toISOString().split('T')[0],
        erstellungsuhrzeit: new Date()
          .toTimeString()
          .split(' ')[0]
          .replace(/:/g, ''),
        testkennung: config.deuev.testMode,
      },
      dsmeRecords: [dsmeRecord],
      footer: {
        recordCount: 1,
      },
    };
  }

  /**
   * Build Änderung DEÜV message
   */
  private async buildAenderungMessage(
    data: SvAenderungDto,
  ): Promise<DeuevMessage> {
    const config = this.getConfig();

    const dsmeRecord: DsmeRecord = {
      satzart: 'DSME',
      betriebsnummer: data.betriebsnummer,
      versicherungsnummer: data.versicherungsnummer,
      nachname: data.neuerNachname || data.nachname,
      vorname: data.neuerVorname || data.vorname,
      geburtsdatum: data.geburtsdatum,
      geschlecht: 'M', // Placeholder
      staatsangehoerigkeit: 'DEU', // Placeholder
      anschrift: data.neueAnschrift || {
        strasse: '',
        hausnummer: '',
        plz: '00000',
        ort: '',
      },
      abgabegrund: data.abgabegrund || Abgabegrund.AENDERUNG,
      zeitraumVon: data.aenderungsdatum,
      beitragsgruppen: data.neueBeitragsgruppen || {
        kv: '1',
        rv: '1',
        av: '1',
        pv: '1',
      },
      entgelt: data.neuesEntgelt
        ? Math.round(data.neuesEntgelt * 100)
        : undefined,
      personengruppe: '101', // Placeholder
    };

    return {
      header: {
        version: config.deuev.version,
        absender: config.deuev.absender,
        erstellungsdatum: new Date().toISOString().split('T')[0],
        erstellungsuhrzeit: new Date()
          .toTimeString()
          .split(' ')[0]
          .replace(/:/g, ''),
        testkennung: config.deuev.testMode,
      },
      dsmeRecords: [dsmeRecord],
      footer: {
        recordCount: 1,
      },
    };
  }

  /**
   * Submit message (actual or simulated)
   */
  private async submitMessage(
    message: DeuevMessage,
    messageType: string,
    employeeId: string,
    carrierId: string,
    autoSubmit: boolean,
  ): Promise<SvResponse> {
    const submissionId = randomUUID();
    const now = new Date();

    // Validate message
    const validation = this.deuevBuilder.validateMessage(message);
    if (!validation.isValid) {
      return {
        submissionId,
        status: SvResponseStatus.ERROR,
        submittedAt: now,
        carrierId,
        messageType,
        recordsSubmitted: message.dsmeRecords.length,
        recordsAccepted: 0,
        recordsRejected: message.dsmeRecords.length,
        errors: validation.errors.map((error) => ({
          code: 'VALIDATION_ERROR',
          message: error,
          severity: ErrorSeverity.ERROR,
        })),
      };
    }

    // Generate DEÜV string
    const deuevString = this.deuevBuilder.buildMessage(message);

    // In test mode or non-autoSubmit, return pending status
    if (!autoSubmit || message.header.testkennung) {
      this.logger.log(
        `DEÜV message generated (${deuevString.length} bytes) - not submitted`,
      );

      return {
        submissionId,
        status: SvResponseStatus.PENDING,
        submittedAt: now,
        carrierId,
        messageType,
        recordsSubmitted: message.dsmeRecords.length,
        recordsAccepted: 0,
        recordsRejected: 0,
        errors: [],
        metadata: {
          messageSize: deuevString.length,
          autoSubmit: false,
          testMode: message.header.testkennung,
        },
      };
    }

    // Actual submission would happen here
    // For now, simulate successful submission
    this.logger.log(`Submitting DEÜV message to carrier ${carrierId}`);

    return {
      submissionId,
      status: SvResponseStatus.ACCEPTED,
      submittedAt: now,
      respondedAt: now,
      carrierId,
      messageType,
      recordsSubmitted: message.dsmeRecords.length,
      recordsAccepted: message.dsmeRecords.length,
      recordsRejected: 0,
      errors: [],
      confirmationNumber: `CONF-${Date.now()}`,
      metadata: {
        messageSize: deuevString.length,
        autoSubmit: true,
      },
    };
  }

  /**
   * Cache submission
   */
  private async cacheSubmission(
    response: SvResponse,
    employeeId: string,
  ): Promise<void> {
    const submissionKey = `${this.cachePrefix}:submission:${response.submissionId}`;
    const employeeKey = `${this.cachePrefix}:employee:${employeeId}:${response.submissionId}`;

    const cached: CachedSubmission = {
      submissionId: response.submissionId,
      employeeId,
      messageType: response.messageType,
      dataHash: createHash('sha256')
        .update(JSON.stringify(response))
        .digest('hex'),
      submittedAt: response.submittedAt.toISOString(),
      status: response.status,
      expiresAt: new Date(
        Date.now() + this.cacheTtl * 1000,
      ).toISOString(),
    };

    await Promise.all([
      this.redisService.set(submissionKey, response, this.cacheTtl),
      this.redisService.set(employeeKey, cached, this.cacheTtl),
    ]);

    this.logger.debug(`Cached submission ${response.submissionId}`);
  }

  /**
   * Parse carrier response (placeholder)
   */
  private parseCarrierResponse(response: string): SvResponse {
    // This would parse actual DEÜV response format
    // Placeholder implementation
    return {
      submissionId: randomUUID(),
      status: SvResponseStatus.ACCEPTED,
      submittedAt: new Date(),
      respondedAt: new Date(),
      carrierId: 'unknown',
      messageType: 'RESPONSE',
      recordsSubmitted: 1,
      recordsAccepted: 1,
      recordsRejected: 0,
      errors: [],
    };
  }

  /**
   * Get configuration
   */
  private getConfig(): SvMeldungConfig {
    return {
      deuev: {
        absender: this.configService.get<string>('SV_ABSENDER', 'TEST'),
        betriebsnummer: this.configService.get<string>(
          'SV_BETRIEBSNUMMER',
          '99999999',
        ),
        companyName: this.configService.get<string>(
          'COMPANY_NAME',
          'Test Company',
        ),
        companyAddress: {
          street: 'Teststrasse',
          houseNumber: '1',
          postalCode: '12345',
          city: 'Teststadt',
        },
        version: '8.1',
        testMode: this.configService.get<boolean>('SV_TEST_MODE', true),
      },
      carriers: [],
      autoSubmit: false,
      archiveMessages: true,
      archiveRetentionDays: 365,
    };
  }

  /**
   * Get carrier name by IK
   */
  private getCarrierName(ik: string): string {
    const carrier = Object.values(GERMAN_HEALTH_CARRIERS).find(
      (c) => c.ik === ik,
    );
    return carrier?.name || 'Unknown Carrier';
  }
}
