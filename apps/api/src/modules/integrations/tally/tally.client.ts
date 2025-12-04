/**
 * Tally Gateway HTTP/XML Client
 *
 * Handles HTTP communication with Tally Gateway Server using XML requests/responses.
 * Tally uses TDL (Tally Definition Language) for data exchange.
 *
 * Default Tally Gateway Server: http://localhost:9000
 */

import { Injectable, Logger } from '@nestjs/common';
import * as xml2js from 'xml2js';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  TallyConfig,
  TallyXmlRequest,
  TallyXmlResponse,
  TallyError,
  TallyClientOptions,
  TallyConnectionTest,
  TallyCompany,
  TallyLedger,
  TallyVoucher,
  TallyStockItem,
} from './tally.types';

@Injectable()
export class TallyClient {
  private readonly logger = new Logger(TallyClient.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly xmlBuilder: xml2js.Builder;
  private readonly xmlParser: xml2js.Parser;

  private readonly DEFAULT_HOST = 'localhost';
  private readonly DEFAULT_PORT = 9000;
  private readonly DEFAULT_TIMEOUT = 30000;
  private readonly DEFAULT_RETRIES = 3;
  private readonly DEFAULT_RETRY_DELAY = 1000;

  constructor(private readonly config?: TallyClientOptions) {
    const host = config?.host || this.DEFAULT_HOST;
    const port = config?.port || this.DEFAULT_PORT;
    const timeout = config?.timeout || this.DEFAULT_TIMEOUT;

    // Initialize Axios instance for Tally Gateway
    this.axiosInstance = axios.create({
      baseURL: `http://${host}:${port}`,
      timeout,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        Accept: 'text/xml',
      },
    });

    // Initialize XML builder (JS object to XML)
    this.xmlBuilder = new xml2js.Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      renderOpts: { pretty: true, indent: '  ' },
      headless: false,
    });

    // Initialize XML parser (XML to JS object)
    this.xmlParser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
      mergeAttrs: true,
      trim: true,
    });

    this.logger.log(`Tally client initialized: ${host}:${port}`);
  }

  /**
   * Test connection to Tally Gateway Server
   */
  async testConnection(companyName?: string): Promise<TallyConnectionTest> {
    try {
      this.logger.debug('Testing Tally Gateway connection...');

      // Try to fetch company list
      const companies = await this.getCompanyList();

      if (companies && companies.length > 0) {
        this.logger.log(`Connected to Tally. Found ${companies.length} companies.`);
        return {
          success: true,
          message: `Successfully connected to Tally Gateway. Found ${companies.length} companies.`,
          availableCompanies: companies.map((c) => c.name),
        };
      }

      return {
        success: false,
        message: 'Connected to Tally Gateway but no companies found.',
        availableCompanies: [],
      };
    } catch (error) {
      this.logger.error('Tally connection test failed:', error);
      return {
        success: false,
        message: 'Failed to connect to Tally Gateway',
        error: error.message,
      };
    }
  }

  /**
   * Get list of companies in Tally
   */
  async getCompanyList(): Promise<TallyCompany[]> {
    const xml = this.buildTdlRequest('Collection', 'Company', '*', {
      CollectionType: 'Company',
    });

    const response = await this.sendRequest(xml);
    return this.parseCompanyListResponse(response);
  }

  /**
   * Get company details
   */
  async getCompany(companyName: string): Promise<TallyCompany> {
    const xml = this.buildTdlRequest('Collection', 'Company', companyName, {
      CollectionType: 'Company',
    });

    const response = await this.sendRequest(xml);
    return this.parseCompanyResponse(response);
  }

  /**
   * Get ledgers from Tally
   */
  async getLedgers(companyName: string, filter?: string): Promise<TallyLedger[]> {
    const xml = this.buildTdlRequest('Collection', 'Ledger', filter || '*', {
      CollectionType: 'Ledger',
      CompanyName: companyName,
    });

    const response = await this.sendRequest(xml);
    return this.parseLedgersResponse(response);
  }

  /**
   * Get single ledger by name
   */
  async getLedger(companyName: string, ledgerName: string): Promise<TallyLedger> {
    const xml = this.buildTdlRequest('Collection', 'Ledger', ledgerName, {
      CollectionType: 'Ledger',
      CompanyName: companyName,
    });

    const response = await this.sendRequest(xml);
    const ledgers = this.parseLedgersResponse(response);
    return ledgers[0] || null;
  }

  /**
   * Get vouchers from Tally
   */
  async getVouchers(
    companyName: string,
    fromDate?: string,
    toDate?: string,
    voucherType?: string,
  ): Promise<TallyVoucher[]> {
    const xml = this.buildTdlRequest('Collection', 'Voucher', '*', {
      CollectionType: 'Voucher',
      CompanyName: companyName,
      FromDate: fromDate,
      ToDate: toDate,
      VoucherTypeName: voucherType,
    });

    const response = await this.sendRequest(xml);
    return this.parseVouchersResponse(response);
  }

  /**
   * Get single voucher by number
   */
  async getVoucher(
    companyName: string,
    voucherType: string,
    voucherNumber: string,
  ): Promise<TallyVoucher> {
    const xml = this.buildTdlRequest('Collection', 'Voucher', voucherNumber, {
      CollectionType: 'Voucher',
      CompanyName: companyName,
      VoucherTypeName: voucherType,
    });

    const response = await this.sendRequest(xml);
    const vouchers = this.parseVouchersResponse(response);
    return vouchers[0] || null;
  }

  /**
   * Get stock items from Tally
   */
  async getStockItems(companyName: string, filter?: string): Promise<TallyStockItem[]> {
    const xml = this.buildTdlRequest('Collection', 'StockItem', filter || '*', {
      CollectionType: 'StockItem',
      CompanyName: companyName,
    });

    const response = await this.sendRequest(xml);
    return this.parseStockItemsResponse(response);
  }

  /**
   * Create/Update ledger in Tally
   */
  async importLedger(companyName: string, ledger: TallyLedger): Promise<boolean> {
    const xml = this.buildImportXml('Ledger', ledger, companyName);
    const response = await this.sendRequest(xml);
    return this.parseImportResponse(response);
  }

  /**
   * Create/Update voucher in Tally
   */
  async importVoucher(companyName: string, voucher: TallyVoucher): Promise<boolean> {
    const xml = this.buildImportXml('Voucher', voucher, companyName);
    const response = await this.sendRequest(xml);
    return this.parseImportResponse(response);
  }

  /**
   * Create/Update stock item in Tally
   */
  async importStockItem(companyName: string, stockItem: TallyStockItem): Promise<boolean> {
    const xml = this.buildImportXml('StockItem', stockItem, companyName);
    const response = await this.sendRequest(xml);
    return this.parseImportResponse(response);
  }

  /**
   * Execute custom TDL query
   */
  async executeTdlQuery(tdlQuery: string): Promise<any> {
    const response = await this.sendRequest(tdlQuery);
    return this.parseGenericResponse(response);
  }

  /**
   * Build TDL request XML for export (fetch data from Tally)
   */
  private buildTdlRequest(
    requestType: string,
    collectionType: string,
    filter: string,
    staticVariables: Record<string, any> = {},
  ): string {
    const envelope = {
      ENVELOPE: {
        HEADER: {
          VERSION: '1',
          TALLYREQUEST: 'Export',
          TYPE: 'Data',
          ID: collectionType,
        },
        BODY: {
          DESC: {
            STATICVARIABLES: this.formatStaticVariables(staticVariables),
            TDL: {
              TDLMESSAGE: {
                COLLECTION: {
                  $: {
                    NAME: collectionType,
                    TYPE: collectionType,
                  },
                },
              },
            },
          },
          DATA: {
            TALLYMESSAGE: {
              $: {
                'xmlns:UDF': 'TallyUDF',
              },
            },
          },
        },
      },
    };

    return this.xmlBuilder.buildObject(envelope);
  }

  /**
   * Build import XML (send data to Tally)
   */
  private buildImportXml(
    masterType: string,
    masterData: any,
    companyName: string,
  ): string {
    const envelope = {
      ENVELOPE: {
        HEADER: {
          VERSION: '1',
          TALLYREQUEST: 'Import',
          TYPE: 'Data',
          ID: masterType,
        },
        BODY: {
          DESC: {
            STATICVARIABLES: {
              SVCURRENTCOMPANY: companyName,
            },
          },
          DATA: {
            TALLYMESSAGE: {
              $: {
                'xmlns:UDF': 'TallyUDF',
              },
              [masterType.toUpperCase()]: this.formatMasterData(masterData),
            },
          },
        },
      },
    };

    return this.xmlBuilder.buildObject(envelope);
  }

  /**
   * Format static variables for TDL
   */
  private formatStaticVariables(variables: Record<string, any>): any {
    const formatted: any = {};
    for (const [key, value] of Object.entries(variables)) {
      if (value !== undefined && value !== null) {
        formatted[key.toUpperCase()] = value;
      }
    }
    return formatted;
  }

  /**
   * Format master data for import
   */
  private formatMasterData(data: any): any {
    // Convert camelCase to UPPERCASE for Tally XML format
    const formatted: any = {
      $: {
        NAME: data.name,
        GUID: data.guid,
      },
    };

    // Add other properties based on master type
    // This is a simplified version - full implementation would handle all Tally fields
    return formatted;
  }

  /**
   * Send HTTP request to Tally Gateway
   */
  private async sendRequest(xmlData: string): Promise<string> {
    const retries = this.config?.retries || this.DEFAULT_RETRIES;
    const retryDelay = this.config?.retryDelay || this.DEFAULT_RETRY_DELAY;

    let lastError: any;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.logger.debug(`Sending request to Tally (attempt ${attempt}/${retries})`);

        const response = await this.axiosInstance.post('', xmlData, {
          headers: {
            'Content-Type': 'text/xml',
          },
        });

        if (response.status === 200 && response.data) {
          return response.data;
        }

        throw new Error(`Unexpected response status: ${response.status}`);
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Request attempt ${attempt} failed: ${error.message}`,
        );

        if (attempt < retries) {
          await this.sleep(retryDelay * attempt);
        }
      }
    }

    const tallyError: TallyError = {
      code: 'TALLY_REQUEST_FAILED',
      message: `Failed to communicate with Tally after ${retries} attempts`,
      details: lastError?.message,
    };

    throw new Error(JSON.stringify(tallyError));
  }

  /**
   * Parse company list response
   */
  private async parseCompanyListResponse(xmlData: string): Promise<TallyCompany[]> {
    try {
      const result = await this.xmlParser.parseStringPromise(xmlData);
      const companies: TallyCompany[] = [];

      // Extract company data from XML response
      // Tally XML structure varies, this is a generic parser
      if (result?.ENVELOPE?.BODY?.DATA?.COLLECTION) {
        const collection = result.ENVELOPE.BODY.DATA.COLLECTION;
        const companyNodes = Array.isArray(collection.COMPANY)
          ? collection.COMPANY
          : [collection.COMPANY];

        for (const node of companyNodes) {
          if (node) {
            companies.push({
              guid: node.GUID || node.$.GUID || '',
              name: node.NAME || node.$.NAME || '',
              mailingName: node.MAILINGNAME,
              address: node.ADDRESS,
              country: node.COUNTRY,
              state: node.STATE,
              pincode: node.PINCODE,
              email: node.EMAIL,
              phone: node.PHONE,
              fax: node.FAX,
              website: node.WEBSITE,
            });
          }
        }
      }

      return companies;
    } catch (error) {
      this.logger.error('Failed to parse company list response:', error);
      throw new Error('Failed to parse Tally company list response');
    }
  }

  /**
   * Parse single company response
   */
  private async parseCompanyResponse(xmlData: string): Promise<TallyCompany> {
    const companies = await this.parseCompanyListResponse(xmlData);
    return companies[0] || null;
  }

  /**
   * Parse ledgers response
   */
  private async parseLedgersResponse(xmlData: string): Promise<TallyLedger[]> {
    try {
      const result = await this.xmlParser.parseStringPromise(xmlData);
      const ledgers: TallyLedger[] = [];

      // Extract ledger data from XML response
      if (result?.ENVELOPE?.BODY?.DATA?.COLLECTION) {
        const collection = result.ENVELOPE.BODY.DATA.COLLECTION;
        const ledgerNodes = Array.isArray(collection.LEDGER)
          ? collection.LEDGER
          : [collection.LEDGER];

        for (const node of ledgerNodes) {
          if (node) {
            ledgers.push({
              guid: node.GUID || node.$.GUID || '',
              name: node.NAME || node.$.NAME || '',
              parent: node.PARENT || '',
              alias: node.ALIAS,
              openingBalance: parseFloat(node.OPENINGBALANCE) || 0,
              mailingName: node.MAILINGNAME,
              address: node.ADDRESS,
              state: node.STATE,
              country: node.COUNTRY,
              pincode: node.PINCODE,
              email: node.EMAIL,
              phone: node.PHONE,
              mobile: node.MOBILE,
              gstin: node.PARTYGSTIN,
              pan: node.INCOMETAXNUMBER,
            });
          }
        }
      }

      return ledgers;
    } catch (error) {
      this.logger.error('Failed to parse ledgers response:', error);
      throw new Error('Failed to parse Tally ledgers response');
    }
  }

  /**
   * Parse vouchers response
   */
  private async parseVouchersResponse(xmlData: string): Promise<TallyVoucher[]> {
    try {
      const result = await this.xmlParser.parseStringPromise(xmlData);
      const vouchers: TallyVoucher[] = [];

      // Extract voucher data from XML response
      if (result?.ENVELOPE?.BODY?.DATA?.COLLECTION) {
        const collection = result.ENVELOPE.BODY.DATA.COLLECTION;
        const voucherNodes = Array.isArray(collection.VOUCHER)
          ? collection.VOUCHER
          : [collection.VOUCHER];

        for (const node of voucherNodes) {
          if (node) {
            vouchers.push({
              guid: node.GUID || node.$.GUID || '',
              voucherType: node.VOUCHERTYPENAME,
              voucherNumber: node.VOUCHERNUMBER,
              date: node.DATE,
              referenceNumber: node.REFERENCE,
              referenceDate: node.REFERENCEDATE,
              narration: node.NARRATION,
              partyLedgerName: node.PARTYLEDGERNAME,
              ledgerEntries: [], // Would need to parse LEDGERENTRIES
              inventoryEntries: [], // Would need to parse INVENTORYENTRIES
            });
          }
        }
      }

      return vouchers;
    } catch (error) {
      this.logger.error('Failed to parse vouchers response:', error);
      throw new Error('Failed to parse Tally vouchers response');
    }
  }

  /**
   * Parse stock items response
   */
  private async parseStockItemsResponse(xmlData: string): Promise<TallyStockItem[]> {
    try {
      const result = await this.xmlParser.parseStringPromise(xmlData);
      const stockItems: TallyStockItem[] = [];

      // Extract stock item data from XML response
      if (result?.ENVELOPE?.BODY?.DATA?.COLLECTION) {
        const collection = result.ENVELOPE.BODY.DATA.COLLECTION;
        const itemNodes = Array.isArray(collection.STOCKITEM)
          ? collection.STOCKITEM
          : [collection.STOCKITEM];

        for (const node of itemNodes) {
          if (node) {
            stockItems.push({
              guid: node.GUID || node.$.GUID || '',
              name: node.NAME || node.$.NAME || '',
              alias: node.ALIAS,
              parent: node.PARENT,
              category: node.CATEGORY,
              unit: node.BASEUNITS,
              openingBalance: parseFloat(node.OPENINGBALANCE) || 0,
              openingValue: parseFloat(node.OPENINGVALUE) || 0,
              gstHsnCode: node.GSTDETAILS?.HSNCODE,
              description: node.DESCRIPTION,
            });
          }
        }
      }

      return stockItems;
    } catch (error) {
      this.logger.error('Failed to parse stock items response:', error);
      throw new Error('Failed to parse Tally stock items response');
    }
  }

  /**
   * Parse import response
   */
  private async parseImportResponse(xmlData: string): Promise<boolean> {
    try {
      const result = await this.xmlParser.parseStringPromise(xmlData);

      // Check for error in response
      if (result?.ENVELOPE?.BODY?.DATA?.IMPORTRESULT) {
        const importResult = result.ENVELOPE.BODY.DATA.IMPORTRESULT;
        if (importResult.$.CREATED === '1' || importResult.$.ALTERED === '1') {
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to parse import response:', error);
      return false;
    }
  }

  /**
   * Parse generic response
   */
  private async parseGenericResponse(xmlData: string): Promise<any> {
    try {
      const result = await this.xmlParser.parseStringPromise(xmlData);
      return result;
    } catch (error) {
      this.logger.error('Failed to parse response:', error);
      throw new Error('Failed to parse Tally response');
    }
  }

  /**
   * Sleep utility for retries
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
