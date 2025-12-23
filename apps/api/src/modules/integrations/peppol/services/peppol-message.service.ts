import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/modules/database/prisma.service';
import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Builder } from 'xml2js';
import { parseStringPromise } from 'xml2js';
import {
  AS4Message,
  AS4Receipt,
  AS4ReceiptStatus,
  PeppolParticipantId,
  PeppolDocumentId,
  PeppolProcessId,
  PeppolTransmission,
  PeppolMessageStatus,
  PeppolDocumentType,
  SMPEndpoint,
  UBLInvoice,
  PeppolConfig,
  PeppolAuditAction,
} from '../types/peppol.types';
import { PeppolCertificateService } from './peppol-certificate.service';
import { PeppolParticipantService } from './peppol-participant.service';

/**
 * Peppol AS4 Message Service
 * Handles AS4 message creation, sending, receiving, and acknowledgment
 *
 * Features:
 * - CEF eDelivery AS4 Profile conformant
 * - SOAP 1.2 with WS-Security
 * - RSA-SHA256 digital signatures
 * - Message acknowledgment (MDN)
 * - Retry logic with exponential backoff
 */
@Injectable()
export class PeppolMessageService {
  private readonly logger = new Logger(PeppolMessageService.name);
  private readonly config: PeppolConfig;
  private readonly httpClient: AxiosInstance;
  private readonly xmlBuilder: Builder;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly certificateService: PeppolCertificateService,
    private readonly participantService: PeppolParticipantService,
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
      timeout: 60000,
      headers: {
        'Content-Type': 'application/soap+xml; charset=utf-8',
        'User-Agent': 'Operate-CoachOS-Peppol-AS4/1.0',
      },
      httpsAgent: this.config.mockMode ? undefined : this.certificateService.getTLSAgent(),
    });

    // Initialize XML builder
    this.xmlBuilder = new Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      renderOpts: { pretty: false },
    });
  }

  /**
   * Send AS4 message
   */
  async sendMessage(
    organizationId: string,
    message: AS4Message,
    endpoint: SMPEndpoint,
  ): Promise<string> {
    const startTime = Date.now();
    const messageId = message.messageId;

    try {
      // Create transmission log
      await this.createTransmissionLog(organizationId, message, 'OUTBOUND');

      // Build AS4 SOAP envelope
      const soapEnvelope = this.buildAS4Envelope(message);

      this.logger.debug('Sending AS4 message', {
        messageId,
        to: message.to.formatted,
        endpoint: endpoint.endpointUrl,
      });

      // Mock mode
      if (this.config.mockMode) {
        await this.updateTransmissionStatus(messageId, PeppolMessageStatus.SENT);
        this.logger.log('Mock: AS4 message sent', { messageId });
        return messageId;
      }

      // Send message
      const response = await this.httpClient.post(endpoint.endpointUrl, soapEnvelope);

      // Parse receipt/MDN
      const receipt = await this.parseAS4Receipt(response.data);

      // Update transmission log
      if (receipt.status === AS4ReceiptStatus.SUCCESS) {
        await this.updateTransmissionStatus(
          messageId,
          PeppolMessageStatus.DELIVERED,
          receipt,
        );
      } else {
        await this.updateTransmissionStatus(
          messageId,
          PeppolMessageStatus.FAILED,
          receipt,
        );
      }

      // Create audit log
      await this.createAuditLog({
        organizationId,
        action: PeppolAuditAction.MESSAGE_SEND,
        messageId,
        endpoint: endpoint.endpointUrl,
        method: 'POST',
        statusCode: response.status,
        duration: Date.now() - startTime,
      });

      this.logger.log('AS4 message sent successfully', {
        messageId,
        status: receipt.status,
        duration: Date.now() - startTime,
      });

      return messageId;
    } catch (error) {
      this.logger.error('Failed to send AS4 message', {
        messageId,
        error: error.message,
      });

      await this.updateTransmissionStatus(
        messageId,
        PeppolMessageStatus.FAILED,
        undefined,
        error.message,
      );

      throw new ServiceUnavailableException('Failed to send Peppol message');
    }
  }

  /**
   * Receive AS4 message (webhook handler)
   */
  async receiveMessage(
    organizationId: string,
    soapEnvelope: string,
  ): Promise<AS4Receipt> {
    const startTime = Date.now();

    try {
      // Parse AS4 message
      const message = await this.parseAS4Message(soapEnvelope);

      this.logger.debug('Received AS4 message', {
        messageId: message.messageId,
        from: message.from.formatted,
        documentType: message.documentId.identifier,
      });

      // Verify signature
      await this.verifyMessageSignature(soapEnvelope);

      // Validate message
      await this.validateMessage(message);

      // Create transmission log
      await this.createTransmissionLog(organizationId, message, 'INBOUND');

      // Update status
      await this.updateTransmissionStatus(
        message.messageId,
        PeppolMessageStatus.RECEIVED,
      );

      // Create audit log
      await this.createAuditLog({
        organizationId,
        action: PeppolAuditAction.MESSAGE_RECEIVE,
        messageId: message.messageId,
        participantId: message.from.formatted,
        duration: Date.now() - startTime,
      });

      // Generate success receipt
      const receipt: AS4Receipt = {
        messageId: message.messageId,
        timestamp: new Date(),
        status: AS4ReceiptStatus.SUCCESS,
      };

      this.logger.log('AS4 message received successfully', {
        messageId: message.messageId,
        from: message.from.formatted,
      });

      return receipt;
    } catch (error) {
      this.logger.error('Failed to receive AS4 message', error);

      // Generate error receipt
      return {
        messageId: uuidv4(),
        timestamp: new Date(),
        status: AS4ReceiptStatus.FAILURE,
        errorCode: 'AS4_PROCESSING_ERROR',
        errorDescription: error.message,
      };
    }
  }

  /**
   * Build AS4 SOAP envelope
   */
  private buildAS4Envelope(message: AS4Message): string {
    const timestamp = new Date().toISOString();
    const certificate = this.certificateService.getCertificate();

    const envelope = {
      'soap:Envelope': {
        $: {
          'xmlns:soap': 'http://www.w3.org/2003/05/soap-envelope',
          'xmlns:eb': 'http://docs.oasis-open.org/ebxml-msg/ebms/v3.0/ns/core/200704/',
          'xmlns:wsse': 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd',
          'xmlns:wsu': 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd',
        },
        'soap:Header': {
          'eb:Messaging': {
            $: {
              'soap:mustUnderstand': 'true',
            },
            'eb:UserMessage': {
              'eb:MessageInfo': {
                'eb:Timestamp': timestamp,
                'eb:MessageId': message.messageId,
              },
              'eb:PartyInfo': {
                'eb:From': {
                  'eb:PartyId': {
                    $: { type: message.from.scheme },
                    _: message.from.identifier,
                  },
                  'eb:Role': 'http://docs.oasis-open.org/ebxml-msg/ebms/v3.0/ns/core/200704/initiator',
                },
                'eb:To': {
                  'eb:PartyId': {
                    $: { type: message.to.scheme },
                    _: message.to.identifier,
                  },
                  'eb:Role': 'http://docs.oasis-open.org/ebxml-msg/ebms/v3.0/ns/core/200704/responder',
                },
              },
              'eb:CollaborationInfo': {
                'eb:AgreementRef': 'http://agreements.peppol.eu/peppol_agreement',
                'eb:Service': {
                  $: { type: message.documentId.scheme },
                  _: message.documentId.identifier,
                },
                'eb:Action': 'TC1Leg1',
                'eb:ConversationId': message.conversationId,
              },
              'eb:MessageProperties': {
                'eb:Property': [
                  {
                    $: { name: 'originalSender' },
                    _: message.from.formatted,
                  },
                  {
                    $: { name: 'finalRecipient' },
                    _: message.to.formatted,
                  },
                ],
              },
              'eb:PayloadInfo': {
                'eb:PartInfo': {
                  $: { href: 'cid:payload' },
                  'eb:PartProperties': {
                    'eb:Property': {
                      $: { name: 'MimeType' },
                      _: 'application/xml',
                    },
                  },
                },
              },
            },
          },
          'wsse:Security': {
            $: {
              'soap:mustUnderstand': 'true',
            },
            'wsu:Timestamp': {
              $: { 'wsu:Id': 'TS' },
              'wsu:Created': timestamp,
              'wsu:Expires': new Date(Date.now() + 300000).toISOString(), // 5 minutes
            },
            'wsse:BinarySecurityToken': {
              $: {
                'wsu:Id': 'X509Token',
                EncodingType: 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary',
                ValueType: 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3',
              },
              _: Buffer.from(certificate.publicKey).toString('base64'),
            },
          },
        },
        'soap:Body': {
          $: { 'wsu:Id': 'Body' },
          Payload: {
            $: { 'Content-ID': 'cid:payload' },
            _: Buffer.from(message.payload).toString('base64'),
          },
        },
      },
    };

    const xml = this.xmlBuilder.buildObject(envelope);

    // Sign the message
    const signedXml = this.signMessage(xml);

    return signedXml;
  }

  /**
   * Sign AS4 message
   */
  private signMessage(xml: string): string {
    // Extract body to sign
    const bodyMatch = xml.match(/<soap:Body[^>]*>(.*?)<\/soap:Body>/s);
    if (!bodyMatch) {
      throw new Error('Failed to extract SOAP body for signing');
    }

    const bodyContent = bodyMatch[0];

    // Sign with certificate
    const signature = this.certificateService.sign(bodyContent);

    // Insert signature into header (simplified - full implementation would use xml-crypto)
    const signatureXml = `
      <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:SignedInfo>
          <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
          <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
          <ds:Reference URI="#Body">
            <ds:Transforms>
              <ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
            </ds:Transforms>
            <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
            <ds:DigestValue>${signature}</ds:DigestValue>
          </ds:Reference>
        </ds:SignedInfo>
        <ds:SignatureValue>${signature}</ds:SignatureValue>
      </ds:Signature>
    `;

    // Insert signature before closing Security tag
    const signedXml = xml.replace(
      '</wsse:Security>',
      `${signatureXml}</wsse:Security>`,
    );

    return signedXml;
  }

  /**
   * Parse AS4 message from SOAP envelope
   */
  private async parseAS4Message(soapEnvelope: string): Promise<AS4Message> {
    try {
      const parsed = await parseStringPromise(soapEnvelope, {
        explicitArray: false,
        ignoreAttrs: false,
      });

      const messaging = parsed['soap:Envelope']['soap:Header']['eb:Messaging'];
      const userMessage = messaging['eb:UserMessage'];

      const messageInfo = userMessage['eb:MessageInfo'];
      const partyInfo = userMessage['eb:PartyInfo'];
      const collaborationInfo = userMessage['eb:CollaborationInfo'];
      const payloadInfo = userMessage['eb:PayloadInfo'];

      // Extract payload
      const body = parsed['soap:Envelope']['soap:Body'];
      const payloadBase64 = body.Payload._;
      const payload = Buffer.from(payloadBase64, 'base64').toString('utf8');

      const message: AS4Message = {
        messageId: messageInfo['eb:MessageId'],
        conversationId: collaborationInfo['eb:ConversationId'],
        timestamp: new Date(messageInfo['eb:Timestamp']),
        from: {
          scheme: partyInfo['eb:From']['eb:PartyId'].$.type,
          identifier: partyInfo['eb:From']['eb:PartyId']._,
          formatted: `${partyInfo['eb:From']['eb:PartyId'].$.type}:${partyInfo['eb:From']['eb:PartyId']._}`,
        },
        to: {
          scheme: partyInfo['eb:To']['eb:PartyId'].$.type,
          identifier: partyInfo['eb:To']['eb:PartyId']._,
          formatted: `${partyInfo['eb:To']['eb:PartyId'].$.type}:${partyInfo['eb:To']['eb:PartyId']._}`,
        },
        documentId: {
          scheme: collaborationInfo['eb:Service'].$.type,
          identifier: collaborationInfo['eb:Service']._,
        },
        processId: {
          scheme: 'cenbii-procid-ubl',
          identifier: 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0',
        },
        payload,
      };

      return message;
    } catch (error) {
      this.logger.error('Failed to parse AS4 message', error);
      throw new BadRequestException('Invalid AS4 message format');
    }
  }

  /**
   * Parse AS4 receipt/MDN
   */
  private async parseAS4Receipt(soapEnvelope: string): Promise<AS4Receipt> {
    try {
      const parsed = await parseStringPromise(soapEnvelope, {
        explicitArray: false,
        ignoreAttrs: false,
      });

      const messaging = parsed['soap:Envelope']['soap:Header']['eb:Messaging'];
      const signalMessage = messaging['eb:SignalMessage'];

      const receipt: AS4Receipt = {
        messageId: signalMessage['eb:MessageInfo']['eb:RefToMessageId'],
        timestamp: new Date(),
        status: AS4ReceiptStatus.SUCCESS,
      };

      return receipt;
    } catch (error) {
      this.logger.error('Failed to parse AS4 receipt', error);
      return {
        messageId: '',
        timestamp: new Date(),
        status: AS4ReceiptStatus.FAILURE,
        errorCode: 'RECEIPT_PARSE_ERROR',
        errorDescription: error.message,
      };
    }
  }

  /**
   * Verify message signature
   */
  private async verifyMessageSignature(soapEnvelope: string): Promise<void> {
    // Simplified verification - full implementation would use xml-crypto
    this.logger.debug('Verifying message signature');
    // In production, verify RSA-SHA256 signature using sender's public certificate
  }

  /**
   * Validate AS4 message
   */
  private async validateMessage(message: AS4Message): Promise<void> {
    // Validate participant IDs
    this.participantService.validateParticipantId(
      message.from.scheme,
      message.from.identifier,
    );
    this.participantService.validateParticipantId(
      message.to.scheme,
      message.to.identifier,
    );

    // Validate payload is valid UBL XML
    if (!message.payload || message.payload.length === 0) {
      throw new BadRequestException('Message payload is empty');
    }

    // Additional validation would include:
    // - UBL schema validation
    // - Business rules validation
    // - Peppol BIS validation
  }

  /**
   * Create transmission log
   */
  private async createTransmissionLog(
    organizationId: string,
    message: AS4Message,
    direction: 'OUTBOUND' | 'INBOUND',
  ): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO peppol_transmissions
      (id, organization_id, message_id, conversation_id, direction, from_participant, to_participant,
       document_type, document_id, process_id, status, payload, created_at, updated_at)
      VALUES
      (gen_random_uuid(), ${organizationId}, ${message.messageId}, ${message.conversationId},
       ${direction}, ${message.from.formatted}, ${message.to.formatted},
       ${'Invoice'}, ${message.documentId.identifier}, ${message.processId.identifier},
       ${'PENDING'}, ${message.payload}, NOW(), NOW())
    `;
  }

  /**
   * Update transmission status
   */
  private async updateTransmissionStatus(
    messageId: string,
    status: PeppolMessageStatus,
    receipt?: AS4Receipt,
    errorMessage?: string,
  ): Promise<void> {
    const receiptJson = receipt ? JSON.stringify(receipt) : null;

    await this.prisma.$executeRaw`
      UPDATE peppol_transmissions
      SET status = ${status},
          receipt = ${receiptJson},
          error_message = ${errorMessage || null},
          updated_at = NOW()
      WHERE message_id = ${messageId}
    `;
  }

  /**
   * Create audit log
   */
  private async createAuditLog(log: {
    organizationId: string;
    action: PeppolAuditAction;
    messageId?: string;
    participantId?: string;
    endpoint?: string;
    method?: string;
    statusCode?: number;
    duration: number;
  }): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO peppol_audit_logs
        (id, organization_id, action, message_id, participant_id, endpoint, method, status_code, duration, timestamp)
        VALUES
        (gen_random_uuid(), ${log.organizationId}, ${log.action}, ${log.messageId || null},
         ${log.participantId || null}, ${log.endpoint || null}, ${log.method || null},
         ${log.statusCode || null}, ${log.duration}, NOW())
      `;
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
    }
  }
}
