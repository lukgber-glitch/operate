import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Builder } from 'xml2js';
import {
  FatturaPAInvoice,
  FatturaPAFormat,
  SDIValidationResult,
  SDIValidationError,
} from '../types/sdi.types';
import { SendSDIInvoiceDto } from '../dto';
import { SDICodiceFiscaleService } from './sdi-codice-fiscale.service';

/**
 * SDI Invoice Service
 * Generates FatturaPA XML format (v1.2.2)
 *
 * Features:
 * - FatturaPA XML generation
 * - Schema validation
 * - Progressive numbering
 * - CIG/CUP codes for PA
 */
@Injectable()
export class SDIInvoiceService {
  private readonly logger = new Logger(SDIInvoiceService.name);
  private readonly xmlBuilder: Builder;

  constructor(
    private readonly fiscalCodeService: SDICodiceFiscaleService,
  ) {
    // Initialize XML builder with FatturaPA specs
    this.xmlBuilder = new Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      renderOpts: { pretty: true, indent: '  ' },
      headless: false,
    });
  }

  /**
   * Generate FatturaPA XML from DTO
   */
  generateFatturaPA(dto: SendSDIInvoiceDto, progressivoInvio: string): string {
    this.logger.log('Generating FatturaPA XML', {
      organizationId: dto.organizationId,
      numero: dto.numero,
      formatoTrasmissione: dto.formatoTrasmissione,
    });

    // Validate invoice data
    const validation = this.validateInvoice(dto);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Invoice validation failed',
        errors: validation.errors,
      });
    }

    // Build FatturaPA structure
    const fatturaPA = this.buildFatturaPAStructure(dto, progressivoInvio);

    // Convert to XML
    const xml = this.xmlBuilder.buildObject(fatturaPA);

    this.logger.log('FatturaPA XML generated successfully', {
      organizationId: dto.organizationId,
      numero: dto.numero,
      size: xml.length,
    });

    return xml;
  }

  /**
   * Build FatturaPA XML structure
   */
  private buildFatturaPAStructure(
    dto: SendSDIInvoiceDto,
    progressivoInvio: string,
  ): any {
    const namespace = 'http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2';

    return {
      'p:FatturaElettronica': {
        $: {
          versione: dto.formatoTrasmissione,
          'xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
          'xmlns:p': namespace,
          'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
          'xsi:schemaLocation': `${namespace} http://www.fatturapa.gov.it/export/fatturazione/sdi/fatturapa/v1.2/Schema_del_file_xml_FatturaPA_versione_1.2.xsd`,
        },
        'FatturaElettronicaHeader': this.buildHeader(dto, progressivoInvio),
        'FatturaElettronicaBody': this.buildBody(dto),
      },
    };
  }

  /**
   * Build FatturaPA Header
   */
  private buildHeader(dto: SendSDIInvoiceDto, progressivoInvio: string): any {
    const supplier = dto.cedentePrestatore;
    const customer = dto.cessionarioCommittente;

    return {
      DatiTrasmissione: {
        IdTrasmittente: {
          IdPaese: 'IT',
          IdCodice: supplier.datiAnagrafici.partitaIVA,
        },
        ProgressivoInvio: progressivoInvio,
        FormatoTrasmissione: dto.formatoTrasmissione,
        CodiceDestinatario: dto.codiceDestinatario || '0000000',
        ...(dto.pecDestinatario && { PECDestinatario: dto.pecDestinatario }),
      },
      CedentePrestatore: {
        DatiAnagrafici: {
          IdFiscaleIVA: {
            IdPaese: 'IT',
            IdCodice: supplier.datiAnagrafici.partitaIVA,
          },
          ...(supplier.datiAnagrafici.codiceFiscale && {
            CodiceFiscale: supplier.datiAnagrafici.codiceFiscale,
          }),
          Anagrafica: this.buildAnagrafica(
            supplier.datiAnagrafici.denominazione,
            supplier.datiAnagrafici.nome,
            supplier.datiAnagrafici.cognome,
          ),
          RegimeFiscale: supplier.datiAnagrafici.regimeFiscale,
        },
        Sede: this.buildAddress(supplier.sede),
        ...(supplier.contattiTrasmittente && {
          Contatti: {
            ...(supplier.contattiTrasmittente.telefono && {
              Telefono: supplier.contattiTrasmittente.telefono,
            }),
            ...(supplier.contattiTrasmittente.email && {
              Email: supplier.contattiTrasmittente.email,
            }),
          },
        }),
      },
      CessionarioCommittente: {
        DatiAnagrafici: {
          ...(customer.datiAnagrafici.partitaIVA && {
            IdFiscaleIVA: {
              IdPaese: 'IT',
              IdCodice: customer.datiAnagrafici.partitaIVA,
            },
          }),
          CodiceFiscale: customer.datiAnagrafici.codiceFiscale,
          Anagrafica: this.buildAnagrafica(
            customer.datiAnagrafici.denominazione,
            customer.datiAnagrafici.nome,
            customer.datiAnagrafici.cognome,
          ),
        },
        Sede: this.buildAddress(customer.sede),
        ...(customer.stabileOrganizzazione && {
          StabileOrganizzazione: this.buildAddress(customer.stabileOrganizzazione),
        }),
      },
    };
  }

  /**
   * Build FatturaPA Body
   */
  private buildBody(dto: SendSDIInvoiceDto): any {
    return {
      DatiGenerali: {
        DatiGeneraliDocumento: {
          TipoDocumento: dto.tipoDocumento,
          Divisa: 'EUR',
          Data: this.formatDate(new Date(dto.data)),
          Numero: dto.numero,
          ...(dto.art73 && { Art73: 'SI' }),
          ...(dto.causale && {
            Causale: Array.isArray(dto.causale) ? dto.causale : [dto.causale],
          }),
        },
      },
      DatiBeniServizi: {
        DettaglioLinee: dto.dettaglioLinee.map((line) => ({
          NumeroLinea: line.numeroLinea,
          Descrizione: line.descrizione,
          ...(line.quantita !== undefined && { Quantita: this.formatDecimal(line.quantita, 2) }),
          ...(line.unitaMisura && { UnitaMisura: line.unitaMisura }),
          PrezzoUnitario: this.formatDecimal(line.prezzoUnitario, 2),
          PrezzoTotale: this.formatDecimal(line.prezzoTotale, 2),
          AliquotaIVA: this.formatDecimal(line.aliquotaIVA, 2),
          ...(line.natura && { Natura: line.natura }),
        })),
        DatiRiepilogo: dto.datiRiepilogo.map((summary) => ({
          AliquotaIVA: this.formatDecimal(summary.aliquotaIVA, 2),
          ...(summary.natura && { Natura: summary.natura }),
          ImponibileImporto: this.formatDecimal(summary.imponibile, 2),
          Imposta: this.formatDecimal(summary.imposta, 2),
          ...(summary.esigibilitaIVA && { EsigibilitaIVA: summary.esigibilitaIVA }),
          ...(summary.riferimentoNormativo && {
            RiferimentoNormativo: summary.riferimentoNormativo,
          }),
        })),
      },
      ...(dto.datiPagamento &&
        dto.datiPagamento.length > 0 && {
          DatiPagamento: dto.datiPagamento.map((payment) => ({
            CondizioniPagamento: payment.condizioniPagamento,
            DettaglioPagamento: payment.dettaglioPagamento.map((detail) => ({
              ModalitaPagamento: detail.modalitaPagamento,
              ...(detail.dataScadenzaPagamento && {
                DataScadenzaPagamento: this.formatDate(new Date(detail.dataScadenzaPagamento)),
              }),
              ImportoPagamento: this.formatDecimal(detail.importoPagamento, 2),
              ...(detail.iban && { IBAN: detail.iban }),
              ...(detail.bic && { BIC: detail.bic }),
              ...(detail.istitutoFinanziario && {
                IstitutoFinanziario: detail.istitutoFinanziario,
              }),
            })),
          })),
        }),
      ...(dto.allegati &&
        dto.allegati.length > 0 && {
          Allegati: dto.allegati.map((allegato) => ({
            NomeAttachment: allegato.nomeAttachment,
            ...(allegato.algoritmoCompressione && {
              AlgoritmoCompressione: allegato.algoritmoCompressione,
            }),
            FormatoAttachment: allegato.formatoAttachment,
            ...(allegato.descrizioneAttachment && {
              DescrizioneAttachment: allegato.descrizioneAttachment,
            }),
            Attachment: allegato.attachment,
          })),
        }),
    };
  }

  /**
   * Build Anagrafica section
   */
  private buildAnagrafica(
    denominazione?: string,
    nome?: string,
    cognome?: string,
  ): any {
    if (denominazione) {
      return { Denominazione: denominazione };
    }

    if (nome && cognome) {
      return { Nome: nome, Cognome: cognome };
    }

    throw new BadRequestException(
      'Either Denominazione or Nome+Cognome must be provided',
    );
  }

  /**
   * Build Address section
   */
  private buildAddress(address: any): any {
    return {
      Indirizzo: address.indirizzo,
      ...(address.numeroCivico && { NumeroCivico: address.numeroCivico }),
      CAP: address.cap,
      Comune: address.comune,
      ...(address.provincia && { Provincia: address.provincia }),
      Nazione: address.nazione,
    };
  }

  /**
   * Validate invoice data
   */
  private validateInvoice(dto: SendSDIInvoiceDto): SDIValidationResult {
    const errors: SDIValidationError[] = [];
    const warnings: SDIValidationError[] = [];

    // Validate supplier fiscal codes
    const supplierPIVA = this.fiscalCodeService.validatePartitaIVA(
      dto.cedentePrestatore.datiAnagrafici.partitaIVA,
    );
    if (!supplierPIVA.valid) {
      errors.push({
        field: 'cedentePrestatore.datiAnagrafici.partitaIVA',
        message: 'Invalid supplier Partita IVA',
        severity: 'ERROR',
        code: 'SDI_001',
      });
    }

    // Validate customer fiscal code
    const customerCF = this.fiscalCodeService.validateCodiceFiscale(
      dto.cessionarioCommittente.datiAnagrafici.codiceFiscale,
    );
    if (!customerCF.valid) {
      errors.push({
        field: 'cessionarioCommittente.datiAnagrafici.codiceFiscale',
        message: 'Invalid customer Codice Fiscale',
        severity: 'ERROR',
        code: 'SDI_002',
      });
    }

    // Validate codice destinatario or PEC
    if (!dto.codiceDestinatario && !dto.pecDestinatario) {
      errors.push({
        field: 'codiceDestinatario',
        message: 'Either Codice Destinatario or PEC email is required',
        severity: 'ERROR',
        code: 'SDI_003',
      });
    }

    if (dto.codiceDestinatario) {
      const validCodiceDestinatario = this.fiscalCodeService.validateCodiceDestinatario(
        dto.codiceDestinatario,
      );
      if (!validCodiceDestinatario) {
        errors.push({
          field: 'codiceDestinatario',
          message: 'Invalid Codice Destinatario (must be 7 characters)',
          severity: 'ERROR',
          code: 'SDI_004',
        });
      }
    }

    if (dto.pecDestinatario) {
      const validPEC = this.fiscalCodeService.validatePEC(dto.pecDestinatario);
      if (!validPEC) {
        errors.push({
          field: 'pecDestinatario',
          message: 'Invalid PEC email format',
          severity: 'ERROR',
          code: 'SDI_005',
        });
      }
    }

    // Validate invoice lines
    if (!dto.dettaglioLinee || dto.dettaglioLinee.length === 0) {
      errors.push({
        field: 'dettaglioLinee',
        message: 'At least one invoice line is required',
        severity: 'ERROR',
        code: 'SDI_006',
      });
    }

    // Validate tax summary
    if (!dto.datiRiepilogo || dto.datiRiepilogo.length === 0) {
      errors.push({
        field: 'datiRiepilogo',
        message: 'Tax summary is required',
        severity: 'ERROR',
        code: 'SDI_007',
      });
    }

    // Validate line numbering
    if (dto.dettaglioLinee) {
      const lineNumbers = dto.dettaglioLinee.map((l) => l.numeroLinea);
      const uniqueLineNumbers = new Set(lineNumbers);
      if (lineNumbers.length !== uniqueLineNumbers.size) {
        errors.push({
          field: 'dettaglioLinee',
          message: 'Duplicate line numbers found',
          severity: 'ERROR',
          code: 'SDI_008',
        });
      }

      // Check sequential numbering starting from 1
      const sorted = [...lineNumbers].sort((a, b) => a - b);
      if (sorted[0] !== 1 || sorted[sorted.length - 1] !== sorted.length) {
        warnings.push({
          field: 'dettaglioLinee',
          message: 'Line numbers should be sequential starting from 1',
          severity: 'WARNING',
          code: 'SDI_W001',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Format decimal number
   */
  private formatDecimal(value: number, decimals: number): string {
    return value.toFixed(decimals);
  }

  /**
   * Generate progressive invoice number
   */
  generateProgressivoInvio(organizationId: string, timestamp: number): string {
    // Format: ORGID_TIMESTAMP
    // Max 5 characters for progressive
    const orgPrefix = organizationId.substring(0, 3).toUpperCase();
    const timestampSuffix = timestamp.toString().slice(-8);
    return `${orgPrefix}${timestampSuffix}`;
  }

  /**
   * Generate filename for FatturaPA
   */
  generateFilename(
    countryCode: string,
    partitaIVA: string,
    progressivoInvio: string,
  ): string {
    // Format: CCNNNNNNNNNNN_PPPPP.xml
    // CC = Country code (IT)
    // NNNNNNNNNNN = Partita IVA (11 digits)
    // PPPPP = Progressive number
    return `${countryCode}${partitaIVA}_${progressivoInvio}.xml`;
  }
}
