import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { parseStringPromise } from 'xml2js';
import {
  PeppolParticipantId,
  PeppolDocumentId,
  PeppolProcessId,
  SMPResponse,
  SMPDocumentType,
  SMPEndpoint,
  PeppolConfig,
} from '../types/peppol.types';
import { PeppolCertificateService } from './peppol-certificate.service';
import * as crypto from 'crypto';

/**
 * Peppol Participant Service
 * Handles SMP (Service Metadata Publisher) lookups and participant validation
 *
 * Features:
 * - SMP DNS lookup via SML (Service Metadata Locator)
 * - Participant ID validation (ISO/IEC 6523)
 * - Endpoint discovery for document exchange
 * - Certificate verification for endpoints
 */
@Injectable()
export class PeppolParticipantService {
  private readonly logger = new Logger(PeppolParticipantService.name);
  private readonly config: PeppolConfig;
  private readonly httpClient: AxiosInstance;

  // Supported participant ID schemes (ISO/IEC 6523)
  private readonly SUPPORTED_SCHEMES = new Map<string, string>([
    ['0192', 'NO:ORGNR'], // Norway
    ['0184', 'DK:CVR'],   // Denmark
    ['0088', 'GLN'],      // Global Location Number
    ['0195', 'SG:UEN'],   // Singapore
    ['0196', 'IS:KTNR'],  // Iceland
    ['0198', 'SE:ORGNR'], // Sweden
    ['0007', 'SE:VAT'],   // Sweden VAT
    ['0151', 'AU:ABN'],   // Australia
    ['0183', 'CH:UID'],   // Switzerland
    ['9925', 'IT:VAT'],   // Italy VAT
    ['9926', 'IT:CF'],    // Italy Fiscal Code
    ['9927', 'IT:SIA'],   // Italy SIA
    ['9928', 'FR:SIRET'], // France SIRET
    ['9929', 'FR:SIREN'], // France SIREN
    ['9930', 'BE:CBE'],   // Belgium CBE
    ['9931', 'NL:KVK'],   // Netherlands KVK
    ['9932', 'DE:LID'],   // Germany
    ['9933', 'ES:VAT'],   // Spain VAT
  ]);

  constructor(
    private readonly configService: ConfigService,
    private readonly certificateService: PeppolCertificateService,
  ) {
    this.config = {
      accessPointUrl: this.configService.get<string>('PEPPOL_ACCESS_POINT_URL') || '',
      participantId: this.configService.get<string>('PEPPOL_PARTICIPANT_ID') || '',
      certificatePath: this.configService.get<string>('PEPPOL_CERTIFICATE_PATH') || '',
      privateKeyPath: this.configService.get<string>('PEPPOL_PRIVATE_KEY_PATH') || '',
      certificatePassword: this.configService.get<string>('PEPPOL_CERTIFICATE_PASSWORD') || '',
      smlDomain: this.configService.get<string>('PEPPOL_SML_DOMAIN') || 'isml.peppol.eu',
      environment: (this.configService.get<string>('PEPPOL_ENVIRONMENT') || 'test') as 'production' | 'test',
      mockMode: this.configService.get<string>('PEPPOL_MOCK_MODE') === 'true',
      tlsMinVersion: 'TLSv1.3',
      certificatePinning: this.configService.get<string>('PEPPOL_CERTIFICATE_PINNING') !== 'false',
    };

    // Initialize HTTP client with TLS agent
    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Operate-CoachOS-Peppol/1.0',
      },
      httpsAgent: this.config.mockMode ? undefined : this.certificateService.getTLSAgent(),
    });
  }

  /**
   * Validate participant ID format
   */
  validateParticipantId(scheme: string, identifier: string): PeppolParticipantId {
    // Validate scheme
    if (!this.SUPPORTED_SCHEMES.has(scheme)) {
      throw new BadRequestException(
        `Unsupported participant ID scheme: ${scheme}. Supported schemes: ${Array.from(this.SUPPORTED_SCHEMES.keys()).join(', ')}`,
      );
    }

    // Validate identifier format (basic validation)
    if (!identifier || identifier.length === 0) {
      throw new BadRequestException('Participant identifier cannot be empty');
    }

    // Remove any whitespace
    identifier = identifier.trim();

    // Format: scheme::identifier
    const formatted = `${scheme}:${identifier}`;

    this.logger.debug('Validated participant ID', { scheme, identifier, formatted });

    return {
      scheme,
      identifier,
      formatted,
    };
  }

  /**
   * Perform SMP lookup for participant
   */
  async lookupParticipant(participantId: PeppolParticipantId): Promise<SMPResponse> {
    const startTime = Date.now();

    try {
      // Mock mode
      if (this.config.mockMode) {
        return this.getMockSMPResponse(participantId);
      }

      // Calculate SMP URL using SML DNS lookup
      const smpUrl = this.calculateSMPUrl(participantId);

      this.logger.debug('Performing SMP lookup', {
        participantId: participantId.formatted,
        smpUrl,
      });

      // Fetch service metadata
      const response = await this.httpClient.get(smpUrl);

      // Parse XML response
      const smpData = await this.parseSMPResponse(response.data, participantId);

      this.logger.log('SMP lookup successful', {
        participantId: participantId.formatted,
        documentTypesCount: smpData.documentTypes.length,
        duration: Date.now() - startTime,
      });

      return smpData;
    } catch (error) {
      this.logger.error('SMP lookup failed', {
        participantId: participantId.formatted,
        error: error.message,
      });
      throw new ServiceUnavailableException('Failed to lookup participant in SMP');
    }
  }

  /**
   * Lookup endpoint for specific document type
   */
  async lookupEndpoint(
    participantId: PeppolParticipantId,
    documentId: PeppolDocumentId,
  ): Promise<SMPEndpoint> {
    const startTime = Date.now();

    try {
      // Mock mode
      if (this.config.mockMode) {
        return this.getMockEndpoint();
      }

      // Calculate endpoint URL
      const endpointUrl = this.calculateEndpointUrl(participantId, documentId);

      this.logger.debug('Performing endpoint lookup', {
        participantId: participantId.formatted,
        documentId: documentId.identifier,
        endpointUrl,
      });

      // Fetch endpoint metadata
      const response = await this.httpClient.get(endpointUrl);

      // Parse XML response
      const endpoint = await this.parseEndpointResponse(response.data);

      // Verify endpoint certificate
      this.verifyEndpointCertificate(endpoint);

      this.logger.log('Endpoint lookup successful', {
        participantId: participantId.formatted,
        documentId: documentId.identifier,
        endpointUrl: endpoint.endpointUrl,
        duration: Date.now() - startTime,
      });

      return endpoint;
    } catch (error) {
      this.logger.error('Endpoint lookup failed', {
        participantId: participantId.formatted,
        documentId: documentId.identifier,
        error: error.message,
      });
      throw new ServiceUnavailableException('Failed to lookup endpoint');
    }
  }

  /**
   * Calculate SMP URL using SML DNS
   */
  private calculateSMPUrl(participantId: PeppolParticipantId): string {
    // Generate MD5 hash of participant identifier (lowercase, without scheme)
    const identifier = `${participantId.scheme}::${participantId.identifier}`.toLowerCase();
    const hash = crypto.createHash('md5').update(identifier).digest('hex');

    // Construct SMP URL: http://B-{hash}.{sml-domain}
    const smpHostname = `B-${hash}.${this.config.smlDomain}`;
    const smpUrl = `http://${smpHostname}`;

    return smpUrl;
  }

  /**
   * Calculate endpoint URL
   */
  private calculateEndpointUrl(
    participantId: PeppolParticipantId,
    documentId: PeppolDocumentId,
  ): string {
    const smpBaseUrl = this.calculateSMPUrl(participantId);

    // URL encode the document identifier
    const encodedDocId = encodeURIComponent(documentId.identifier);
    const encodedParticipantId = encodeURIComponent(participantId.formatted);

    // SMP endpoint URL format
    const endpointUrl = `${smpBaseUrl}/${encodedParticipantId}/services/${encodedDocId}`;

    return endpointUrl;
  }

  /**
   * Parse SMP response XML
   */
  private async parseSMPResponse(
    xml: string,
    participantId: PeppolParticipantId,
  ): Promise<SMPResponse> {
    try {
      const parsed = await parseStringPromise(xml, {
        explicitArray: false,
        ignoreAttrs: false,
        tagNameProcessors: [this.stripNamespace],
      });

      const serviceGroup = parsed.ServiceGroup;
      const serviceMetadataReferenceList =
        serviceGroup?.ServiceMetadataReferenceCollection?.ServiceMetadataReference || [];

      const references = Array.isArray(serviceMetadataReferenceList)
        ? serviceMetadataReferenceList
        : [serviceMetadataReferenceList];

      const documentTypes: SMPDocumentType[] = references.map((ref: any) => {
        const href = ref.$ ? ref.$.href : ref;
        return this.extractDocumentTypeFromHref(href);
      });

      return {
        participantId,
        documentTypes,
      };
    } catch (error) {
      this.logger.error('Failed to parse SMP response', error);
      throw new ServiceUnavailableException('Invalid SMP response');
    }
  }

  /**
   * Parse endpoint response XML
   */
  private async parseEndpointResponse(xml: string): Promise<SMPEndpoint> {
    try {
      const parsed = await parseStringPromise(xml, {
        explicitArray: false,
        ignoreAttrs: false,
        tagNameProcessors: [this.stripNamespace],
      });

      const serviceMetadata = parsed.ServiceMetadata;
      const process = serviceMetadata?.ServiceInformation?.ProcessList?.Process;
      const endpoint = process?.ServiceEndpointList?.Endpoint;

      if (!endpoint) {
        throw new Error('No endpoint found in response');
      }

      return {
        transportProfile: endpoint.TransportProfile || 'peppol-transport-as4-v2_0',
        endpointUrl: endpoint.EndpointURI || endpoint.EndpointReference?.Address,
        requireBusinessLevelSignature: endpoint.RequireBusinessLevelSignature === 'true',
        minimumAuthenticationLevel: endpoint.MinimumAuthenticationLevel,
        certificate: endpoint.Certificate,
        serviceActivationDate: endpoint.ServiceActivationDate
          ? new Date(endpoint.ServiceActivationDate)
          : undefined,
        serviceExpirationDate: endpoint.ServiceExpirationDate
          ? new Date(endpoint.ServiceExpirationDate)
          : undefined,
        technicalContactUrl: endpoint.TechnicalContactUrl,
        technicalInformationUrl: endpoint.TechnicalInformationUrl,
      };
    } catch (error) {
      this.logger.error('Failed to parse endpoint response', error);
      throw new ServiceUnavailableException('Invalid endpoint response');
    }
  }

  /**
   * Extract document type from SMP reference href
   */
  private extractDocumentTypeFromHref(href: string): SMPDocumentType {
    // Extract document ID from URL path
    const parts = href.split('/');
    const docIdPart = parts[parts.length - 1];
    const decodedDocId = decodeURIComponent(docIdPart);

    return {
      documentId: {
        scheme: 'busdox-docid-qns',
        identifier: decodedDocId,
      },
      processIds: [], // Would need additional lookup to get processes
      endpoints: [], // Would need additional lookup to get endpoints
    };
  }

  /**
   * Verify endpoint certificate
   */
  private verifyEndpointCertificate(endpoint: SMPEndpoint): void {
    if (!endpoint.certificate) {
      throw new ServiceUnavailableException('Endpoint certificate not provided');
    }

    try {
      // Parse and validate certificate
      const certPem = `-----BEGIN CERTIFICATE-----\n${endpoint.certificate}\n-----END CERTIFICATE-----`;
      const cert = new crypto.X509Certificate(certPem);

      // Check validity dates
      const now = new Date();
      if (now < new Date(cert.validFrom) || now > new Date(cert.validTo)) {
        throw new Error('Endpoint certificate is expired or not yet valid');
      }

      this.logger.debug('Endpoint certificate verified', {
        subject: cert.subject,
        validFrom: cert.validFrom,
        validTo: cert.validTo,
      });
    } catch (error) {
      this.logger.error('Failed to verify endpoint certificate', error);
      throw new ServiceUnavailableException('Invalid endpoint certificate');
    }
  }

  /**
   * Strip XML namespace from tag names
   */
  private stripNamespace(name: string): string {
    return name.replace(/^.*:/, '');
  }

  /**
   * Mock SMP response for development
   */
  private getMockSMPResponse(participantId: PeppolParticipantId): SMPResponse {
    return {
      participantId,
      documentTypes: [
        {
          documentId: {
            scheme: 'busdox-docid-qns',
            identifier:
              'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2::Invoice##urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0::2.1',
          },
          processIds: [
            {
              scheme: 'cenbii-procid-ubl',
              identifier: 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0',
            },
          ],
          endpoints: [this.getMockEndpoint()],
        },
      ],
    };
  }

  /**
   * Mock endpoint for development
   */
  private getMockEndpoint(): SMPEndpoint {
    return {
      transportProfile: 'peppol-transport-as4-v2_0',
      endpointUrl: 'https://mock-ap.peppol.example/as4',
      requireBusinessLevelSignature: false,
      certificate: 'MOCK_CERTIFICATE_BASE64',
      serviceActivationDate: new Date('2024-01-01'),
      serviceExpirationDate: new Date('2025-12-31'),
    };
  }
}
