import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * Tax Context Service
 * Provides country-aware tax context from organisation data
 */

export interface TaxContext {
  country: string;
  vatNumber: string | null;
  vatScheme: string | null;
  vatRegistered: boolean;
  taxAuthority: string | null;
  taxAuthorityUrl: string | null;
  currency: string;
  timezone: string;
  companyType: string | null;
  taxRegistrationNumber: string | null;
  utrNumber: string | null;
  payeReference: string | null;
  commercialRegistration: string | null;
  tradeLicenseNumber: string | null;
}

@Injectable()
export class TaxContextService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get tax context for an organisation
   * Retrieves country, tax registration details, and tax authority information
   */
  async getTaxContext(orgId: string): Promise<TaxContext> {
    const org = await this.prisma.organisation.findUnique({
      where: { id: orgId },
      select: {
        country: true,
        currency: true,
        timezone: true,
        vatNumber: true,
        vatScheme: true,
        companyType: true,
        taxRegistrationNumber: true,
        utrNumber: true,
        payeReference: true,
        commercialRegistration: true,
        tradeLicenseNumber: true,
        companyRegistrationNumber: true,
      },
    });

    if (!org) {
      throw new Error(`Organisation not found: ${orgId}`);
    }

    const country = org.country || 'DE';
    const vatRegistered = !!org.vatNumber;

    return {
      country,
      vatNumber: org.vatNumber,
      vatScheme: org.vatScheme,
      vatRegistered,
      taxAuthority: this.getTaxAuthorityForCountry(country),
      taxAuthorityUrl: this.getTaxAuthorityUrlForCountry(country),
      currency: org.currency || 'EUR',
      timezone: org.timezone || 'Europe/Berlin',
      companyType: org.companyType,
      taxRegistrationNumber: org.taxRegistrationNumber,
      utrNumber: org.utrNumber,
      payeReference: org.payeReference,
      commercialRegistration: org.commercialRegistration,
      tradeLicenseNumber: org.tradeLicenseNumber,
    };
  }

  /**
   * Get tax authority name for a country code
   */
  private getTaxAuthorityForCountry(country: string): string | null {
    const authorities: Record<string, string> = {
      // DACH Region
      DE: 'ELSTER (Finanzamt)',
      AT: 'FinanzOnline',
      CH: 'ESTV (Eidgenössische Steuerverwaltung)',

      // Western Europe
      FR: 'Direction Générale des Finances Publiques (DGFiP)',
      NL: 'Belastingdienst',
      BE: 'MyMinfin (SPF Finances)',
      LU: 'Administration des Contributions Directes (ACD)',

      // Southern Europe
      IT: 'Agenzia delle Entrate',
      ES: 'Agencia Tributaria',
      PT: 'Autoridade Tributária e Aduaneira (AT)',
      GR: 'Independent Authority for Public Revenue (IAPR)',

      // Northern Europe
      UK: 'HMRC (His Majesty\'s Revenue and Customs)',
      GB: 'HMRC (His Majesty\'s Revenue and Customs)',
      IE: 'Revenue Commissioners',
      SE: 'Skatteverket',
      DK: 'Skattestyrelsen',
      NO: 'Skatteetaten',
      FI: 'Verohallinto',

      // Eastern Europe
      PL: 'Ministerstwo Finansów',
      CZ: 'Finanční správa',
      HU: 'Nemzeti Adó- és Vámhivatal (NAV)',
      RO: 'Agenția Națională de Administrare Fiscală (ANAF)',

      // North America
      US: 'IRS (Internal Revenue Service)',
      CA: 'CRA (Canada Revenue Agency)',

      // Asia-Pacific
      AU: 'ATO (Australian Taxation Office)',
      NZ: 'Inland Revenue',
      SG: 'IRAS (Inland Revenue Authority of Singapore)',
      HK: 'Inland Revenue Department',
      JP: 'National Tax Agency (NTA)',
      IN: 'Income Tax Department',

      // Middle East
      AE: 'Federal Tax Authority (FTA)',
      SA: 'ZATCA (Zakat, Tax and Customs Authority)',
      IL: 'Israel Tax Authority',

      // Latin America
      BR: 'Receita Federal do Brasil',
      MX: 'SAT (Servicio de Administración Tributaria)',
      AR: 'AFIP (Administración Federal de Ingresos Públicos)',
      CL: 'Servicio de Impuestos Internos (SII)',
    };

    return authorities[country] || null;
  }

  /**
   * Get tax authority website URL for a country code
   */
  private getTaxAuthorityUrlForCountry(country: string): string | null {
    const urls: Record<string, string> = {
      // DACH Region
      DE: 'https://www.elster.de',
      AT: 'https://finanzonline.bmf.gv.at',
      CH: 'https://www.estv.admin.ch',

      // Western Europe
      FR: 'https://www.impots.gouv.fr',
      NL: 'https://www.belastingdienst.nl',
      BE: 'https://finances.belgium.be',
      LU: 'https://impotsdirects.public.lu',

      // Southern Europe
      IT: 'https://www.agenziaentrate.gov.it',
      ES: 'https://sede.agenciatributaria.gob.es',
      PT: 'https://www.portaldasfinancas.gov.pt',
      GR: 'https://www.aade.gr',

      // Northern Europe
      UK: 'https://www.gov.uk/government/organisations/hm-revenue-customs',
      GB: 'https://www.gov.uk/government/organisations/hm-revenue-customs',
      IE: 'https://www.revenue.ie',
      SE: 'https://www.skatteverket.se',
      DK: 'https://www.skat.dk',
      NO: 'https://www.skatteetaten.no',
      FI: 'https://www.vero.fi',

      // Eastern Europe
      PL: 'https://www.finanse.mf.gov.pl',
      CZ: 'https://www.financnisprava.cz',
      HU: 'https://nav.gov.hu',
      RO: 'https://www.anaf.ro',

      // North America
      US: 'https://www.irs.gov',
      CA: 'https://www.canada.ca/en/revenue-agency.html',

      // Asia-Pacific
      AU: 'https://www.ato.gov.au',
      NZ: 'https://www.ird.govt.nz',
      SG: 'https://www.iras.gov.sg',
      HK: 'https://www.ird.gov.hk',
      JP: 'https://www.nta.go.jp',
      IN: 'https://www.incometax.gov.in',

      // Middle East
      AE: 'https://tax.gov.ae',
      SA: 'https://zatca.gov.sa',
      IL: 'https://www.gov.il/en/departments/israel_tax_authority',

      // Latin America
      BR: 'https://www.gov.br/receitafederal',
      MX: 'https://www.sat.gob.mx',
      AR: 'https://www.afip.gob.ar',
      CL: 'https://www.sii.cl',
    };

    return urls[country] || null;
  }

  /**
   * Check if organisation is VAT registered
   */
  async isVatRegistered(orgId: string): Promise<boolean> {
    const org = await this.prisma.organisation.findUnique({
      where: { id: orgId },
      select: { vatNumber: true },
    });

    return !!org?.vatNumber;
  }

  /**
   * Get VAT filing frequency for country
   * Returns typical filing frequency: 'monthly', 'quarterly', 'annual'
   */
  getVatFilingFrequency(country: string): string {
    const frequencies: Record<string, string> = {
      // Monthly filing
      DE: 'monthly', // Germany - monthly for new businesses, can be quarterly later
      AT: 'monthly', // Austria - monthly/quarterly depending on turnover
      ES: 'monthly', // Spain - monthly/quarterly
      IT: 'monthly', // Italy - monthly/quarterly

      // Quarterly filing
      UK: 'quarterly', // UK - quarterly
      GB: 'quarterly',
      IE: 'quarterly', // Ireland - quarterly/monthly
      FR: 'quarterly', // France - monthly/quarterly
      NL: 'quarterly', // Netherlands - quarterly
      BE: 'quarterly', // Belgium - quarterly/monthly
      SE: 'quarterly', // Sweden - quarterly/monthly
      DK: 'quarterly', // Denmark - quarterly
      NO: 'quarterly', // Norway - bi-monthly
      FI: 'quarterly', // Finland - quarterly/monthly

      // North America
      US: 'quarterly', // US - varies by state
      CA: 'quarterly', // Canada - quarterly/monthly/annual

      // Default
      DEFAULT: 'quarterly',
    };

    return frequencies[country] || frequencies.DEFAULT;
  }

  /**
   * Get tax year start month for country
   * Returns month number (1-12)
   */
  getTaxYearStartMonth(country: string): number {
    const taxYearStarts: Record<string, number> = {
      // Calendar year (January)
      DE: 1,
      AT: 1,
      FR: 1,
      ES: 1,
      IT: 1,
      NL: 1,
      BE: 1,
      SE: 1,
      DK: 1,
      NO: 1,
      FI: 1,
      PL: 1,
      CZ: 1,
      US: 1,

      // April
      UK: 4,
      GB: 4,
      IE: 1,
      IN: 4,
      SG: 4,
      HK: 4,

      // July
      AU: 7,
      NZ: 4,

      // October
      CA: 1, // Federal is calendar year

      // Default to calendar year
      DEFAULT: 1,
    };

    return taxYearStarts[country] || taxYearStarts.DEFAULT;
  }
}
