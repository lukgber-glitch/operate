import { Builder } from 'xml2js';
import {
  VatReturnSubmission,
  IncomeTaxSubmission,
} from '../interfaces/fon-submission.interface';

/**
 * FinanzOnline XML Builder Utility
 * Builds XML documents for FinanzOnline SOAP submissions
 */

const xmlBuilder = new Builder({
  xmldec: { version: '1.0', encoding: 'UTF-8' },
  renderOpts: { pretty: true, indent: '  ' },
});

/**
 * Build SOAP envelope
 */
function buildSoapEnvelope(body: any): string {
  const envelope = {
    'soap:Envelope': {
      $: {
        'xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
        'xmlns:fon': 'http://www.bmf.gv.at/fon',
      },
      'soap:Header': {},
      'soap:Body': body,
    },
  };

  return xmlBuilder.buildObject(envelope);
}

/**
 * Build authentication request XML
 */
export function buildAuthRequest(
  taxId: string,
  certificate: string,
  timestamp: Date,
): string {
  const body = {
    'fon:AuthenticateRequest': {
      'fon:TaxId': taxId,
      'fon:Certificate': certificate,
      'fon:Timestamp': timestamp.toISOString(),
    },
  };

  return buildSoapEnvelope(body);
}

/**
 * Build logout request XML
 */
export function buildLogoutRequest(sessionId: string, token: string): string {
  const body = {
    'fon:LogoutRequest': {
      'fon:SessionId': sessionId,
      'fon:Token': token,
    },
  };

  return buildSoapEnvelope(body);
}

/**
 * Build VAT return submission XML
 */
export function buildVatReturnXml(
  submission: VatReturnSubmission,
  sessionToken: string,
): string {
  const body = {
    'fon:VATReturnRequest': {
      'fon:Header': {
        'fon:SessionToken': sessionToken,
        'fon:TaxId': submission.taxId,
        'fon:VatId': submission.vatId || '',
        'fon:DeclarationDate': submission.declarationDate.toISOString(),
      },
      'fon:Period': {
        'fon:Year': submission.period.year,
        'fon:Type': submission.period.type,
        'fon:Number': submission.period.period || 0,
        'fon:StartDate': submission.period.startDate.toISOString(),
        'fon:EndDate': submission.period.endDate.toISOString(),
      },
      'fon:Lines': {
        'fon:Line': submission.lines.map((line) => ({
          'fon:Code': line.code,
          'fon:Amount': line.amount,
          'fon:Description': line.description || '',
        })),
      },
      'fon:Summary': {
        'fon:TotalOutputVAT': submission.totalOutputVat,
        'fon:TotalInputVAT': submission.totalInputVat,
        'fon:NetVAT': submission.netVat,
      },
      'fon:Submitter': {
        'fon:Name': submission.submitterName || '',
        'fon:Phone': submission.submitterPhone || '',
      },
      'fon:Remarks': submission.remarks || '',
    },
  };

  return buildSoapEnvelope(body);
}

/**
 * Build income tax submission XML
 */
export function buildIncomeTaxXml(
  submission: IncomeTaxSubmission,
  sessionToken: string,
): string {
  const body = {
    'fon:IncomeTaxRequest': {
      'fon:Header': {
        'fon:SessionToken': sessionToken,
        'fon:TaxId': submission.taxId,
        'fon:TaxYear': submission.taxYear,
        'fon:DeclarationDate': submission.declarationDate.toISOString(),
      },
      'fon:PersonalInfo': {
        'fon:FirstName': submission.personalInfo.firstName,
        'fon:LastName': submission.personalInfo.lastName,
        'fon:DateOfBirth': submission.personalInfo.dateOfBirth.toISOString(),
        'fon:SocialSecurityNumber':
          submission.personalInfo.socialSecurityNumber || '',
        'fon:Address': {
          'fon:Street': submission.personalInfo.address.street,
          'fon:PostalCode': submission.personalInfo.address.postalCode,
          'fon:City': submission.personalInfo.address.city,
          'fon:Country': submission.personalInfo.address.country,
        },
        'fon:MaritalStatus': submission.personalInfo.maritalStatus || '',
      },
      'fon:Income': {
        'fon:Employment': submission.income.employment || 0,
        'fon:SelfEmployment': submission.income.selfEmployment || 0,
        'fon:Rental': submission.income.rental || 0,
        'fon:Investment': submission.income.investment || 0,
        'fon:Other': submission.income.other || 0,
        'fon:TotalGross': submission.income.totalGross,
      },
      'fon:Deductions': {
        'fon:BusinessExpenses': submission.deductions.businessExpenses || 0,
        'fon:HomeOffice': submission.deductions.homeOffice || 0,
        'fon:Commuting': submission.deductions.commuting || 0,
        'fon:SocialSecurity': submission.deductions.socialSecurity || 0,
        'fon:Insurance': submission.deductions.insurance || 0,
        'fon:Total': submission.deductions.total,
      },
      'fon:SpecialExpenses': submission.specialExpenses
        ? {
            'fon:Expense': submission.specialExpenses.map((expense) => ({
              'fon:Type': expense.type,
              'fon:Amount': expense.amount,
              'fon:Description': expense.description,
              'fon:DocumentsRef': expense.documentsRef || '',
            })),
          }
        : undefined,
      'fon:TaxAdvisor': submission.taxAdvisor
        ? {
            'fon:AdvisorNumber': submission.taxAdvisor.advisorNumber,
            'fon:Name': submission.taxAdvisor.name,
            'fon:Email': submission.taxAdvisor.email || '',
            'fon:Phone': submission.taxAdvisor.phone || '',
          }
        : undefined,
    },
  };

  return buildSoapEnvelope(body);
}

/**
 * Build status query request XML
 */
export function buildStatusQueryXml(
  referenceId: string,
  sessionToken: string,
): string {
  const body = {
    'fon:StatusQueryRequest': {
      'fon:SessionToken': sessionToken,
      'fon:ReferenceId': referenceId,
    },
  };

  return buildSoapEnvelope(body);
}

/**
 * Parse XML response to JSON
 */
export async function parseXmlResponse(xml: string): Promise<any> {
  const { parseStringPromise } = await import('xml2js');
  try {
    const result = await parseStringPromise(xml, {
      explicitArray: false,
      mergeAttrs: true,
      trim: true,
    });

    // Extract SOAP body
    const envelope = result['soap:Envelope'] || result.Envelope;
    const body = envelope['soap:Body'] || envelope.Body;

    return body;
  } catch (error) {
    throw new Error(`XML parsing failed: ${error.message}`);
  }
}

/**
 * Extract SOAP fault from response
 */
export function extractSoapFault(responseBody: any): {
  faultcode: string;
  faultstring: string;
  detail?: any;
} | null {
  const fault = responseBody['soap:Fault'] || responseBody.Fault;

  if (!fault) {
    return null;
  }

  return {
    faultcode: fault.faultcode,
    faultstring: fault.faultstring,
    detail: fault.detail,
  };
}

/**
 * Validate XML structure
 */
export function validateXml(xml: string): boolean {
  try {
    // Basic XML validation
    const hasXmlDeclaration = xml.includes('<?xml');
    const hasRootElement = xml.includes('<soap:Envelope');
    const hasClosingTag = xml.includes('</soap:Envelope>');

    return hasXmlDeclaration && hasRootElement && hasClosingTag;
  } catch {
    return false;
  }
}

/**
 * Escape XML special characters
 */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Unescape XML special characters
 */
export function unescapeXml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
