import { Injectable, Logger } from '@nestjs/common';
import { SII_NAMESPACES } from './constants/sii.constants';
import {
  SiiIssuedInvoice,
  SiiReceivedInvoice,
  SiiPaymentRecord,
  SiiParty,
  SiiVatLine,
} from './interfaces/sii-invoice.interface';

/**
 * SII XML Builder Service
 * Builds SOAP/XML requests compliant with AEAT SII specifications
 */
@Injectable()
export class SiiXmlBuilderService {
  private readonly logger = new Logger(SiiXmlBuilderService.name);

  /**
   * Build SOAP envelope for issued invoices submission
   */
  buildIssuedInvoicesRequest(
    holder: SiiParty,
    fiscalYear: number,
    period: string,
    invoices: SiiIssuedInvoice[],
  ): string {
    const registros = invoices
      .map((invoice) => this.buildIssuedInvoiceElement(invoice))
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="${SII_NAMESPACES.soap}" xmlns:sii="${SII_NAMESPACES.sii}" xmlns:siiLR="${SII_NAMESPACES.siiLR}">
  <soapenv:Header/>
  <soapenv:Body>
    <sii:SuministroLRFacturasEmitidas>
      <sii:Cabecera>
        <sii:IDVersionSii>1.1</sii:IDVersionSii>
        <sii:Titular>
          <sii:NIF>${this.escapeXml(holder.nif)}</sii:NIF>
          <sii:NombreRazon>${this.escapeXml(holder.name)}</sii:NombreRazon>
        </sii:Titular>
        <sii:TipoComunicacion>A0</sii:TipoComunicacion>
      </sii:Cabecera>
      <sii:RegistroLRFacturasEmitidas>
        ${registros}
      </sii:RegistroLRFacturasEmitidas>
    </sii:SuministroLRFacturasEmitidas>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Build SOAP envelope for received invoices submission
   */
  buildReceivedInvoicesRequest(
    holder: SiiParty,
    fiscalYear: number,
    period: string,
    invoices: SiiReceivedInvoice[],
  ): string {
    const registros = invoices
      .map((invoice) => this.buildReceivedInvoiceElement(invoice))
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="${SII_NAMESPACES.soap}" xmlns:sii="${SII_NAMESPACES.sii}" xmlns:siiLR="${SII_NAMESPACES.siiLR}">
  <soapenv:Header/>
  <soapenv:Body>
    <sii:SuministroLRFacturasRecibidas>
      <sii:Cabecera>
        <sii:IDVersionSii>1.1</sii:IDVersionSii>
        <sii:Titular>
          <sii:NIF>${this.escapeXml(holder.nif)}</sii:NIF>
          <sii:NombreRazon>${this.escapeXml(holder.name)}</sii:NombreRazon>
        </sii:Titular>
        <sii:TipoComunicacion>A0</sii:TipoComunicacion>
      </sii:Cabecera>
      <sii:RegistroLRFacturasRecibidas>
        ${registros}
      </sii:RegistroLRFacturasRecibidas>
    </sii:SuministroLRFacturasRecibidas>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Build SOAP envelope for payment/collection records
   */
  buildPaymentRequest(
    holder: SiiParty,
    fiscalYear: number,
    period: string,
    payments: SiiPaymentRecord[],
  ): string {
    const registros = payments
      .map((payment) => this.buildPaymentElement(payment))
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="${SII_NAMESPACES.soap}" xmlns:sii="${SII_NAMESPACES.sii}">
  <soapenv:Header/>
  <soapenv:Body>
    <sii:SuministroLRCobrosMetalico>
      <sii:Cabecera>
        <sii:IDVersionSii>1.0</sii:IDVersionSii>
        <sii:Titular>
          <sii:NIF>${this.escapeXml(holder.nif)}</sii:NIF>
          <sii:NombreRazon>${this.escapeXml(holder.name)}</sii:NombreRazon>
        </sii:Titular>
        <sii:TipoComunicacion>A0</sii:TipoComunicacion>
      </sii:Cabecera>
      <sii:RegistroLRCobrosMetalico>
        ${registros}
      </sii:RegistroLRCobrosMetalico>
    </sii:SuministroLRCobrosMetalico>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Build query request
   */
  buildQueryRequest(
    holder: SiiParty,
    fiscalYear: number,
    period?: string,
    invoiceNumber?: string,
    issueDate?: Date,
  ): string {
    const periodFilter = period
      ? `<sii:PeriodoImpositivo>
          <sii:Ejercicio>${fiscalYear}</sii:Ejercicio>
          <sii:Periodo>${period}</sii:Periodo>
        </sii:PeriodoImpositivo>`
      : '';

    const invoiceFilter =
      invoiceNumber && issueDate
        ? `<sii:IDFactura>
          <sii:NumSerieFacturaEmisor>${this.escapeXml(invoiceNumber)}</sii:NumSerieFacturaEmisor>
          <sii:FechaExpedicionFacturaEmisor>${this.formatDate(issueDate)}</sii:FechaExpedicionFacturaEmisor>
        </sii:IDFactura>`
        : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="${SII_NAMESPACES.soap}" xmlns:sii="${SII_NAMESPACES.sii}">
  <soapenv:Header/>
  <soapenv:Body>
    <sii:ConsultaLRFacturasEmitidas>
      <sii:Cabecera>
        <sii:IDVersionSii>1.1</sii:IDVersionSii>
        <sii:Titular>
          <sii:NIF>${this.escapeXml(holder.nif)}</sii:NIF>
          <sii:NombreRazon>${this.escapeXml(holder.name)}</sii:NombreRazon>
        </sii:Titular>
      </sii:Cabecera>
      <sii:FiltroConsulta>
        ${periodFilter}
        ${invoiceFilter}
      </sii:FiltroConsulta>
    </sii:ConsultaLRFacturasEmitidas>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Build delete/cancel invoice request
   */
  buildDeleteRequest(
    holder: SiiParty,
    fiscalYear: number,
    period: string,
    invoiceNumber: string,
    issueDate: Date,
  ): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="${SII_NAMESPACES.soap}" xmlns:sii="${SII_NAMESPACES.sii}">
  <soapenv:Header/>
  <soapenv:Body>
    <sii:BajaLRFacturasEmitidas>
      <sii:Cabecera>
        <sii:IDVersionSii>1.1</sii:IDVersionSii>
        <sii:Titular>
          <sii:NIF>${this.escapeXml(holder.nif)}</sii:NIF>
          <sii:NombreRazon>${this.escapeXml(holder.name)}</sii:NombreRazon>
        </sii:Titular>
      </sii:Cabecera>
      <sii:RegistroLRBajaExpedidas>
        <sii:PeriodoImpositivo>
          <sii:Ejercicio>${fiscalYear}</sii:Ejercicio>
          <sii:Periodo>${period}</sii:Periodo>
        </sii:PeriodoImpositivo>
        <sii:IDFactura>
          <sii:NumSerieFacturaEmisor>${this.escapeXml(invoiceNumber)}</sii:NumSerieFacturaEmisor>
          <sii:FechaExpedicionFacturaEmisor>${this.formatDate(issueDate)}</sii:FechaExpedicionFacturaEmisor>
        </sii:IDFactura>
      </sii:RegistroLRBajaExpedidas>
    </sii:BajaLRFacturasEmitidas>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Build individual issued invoice element
   */
  private buildIssuedInvoiceElement(invoice: SiiIssuedInvoice): string {
    const vatLines = invoice.vatLines
      .map((line) => this.buildVatLineElement(line, 'Emitida'))
      .join('\n');

    const rectification = invoice.rectification
      ? `<sii:FacturaRectificativa>
          <sii:Tipo>${invoice.rectification.rectificationType}</sii:Tipo>
          ${invoice.rectification.rectificationBase ? `<sii:ImporteRectificacion><sii:BaseRectificada>${this.formatAmount(invoice.rectification.rectificationBase)}</sii:BaseRectificada></sii:ImporteRectificacion>` : ''}
        </sii:FacturaRectificativa>`
      : '';

    const counterpart = invoice.isIntracommunity
      ? `<sii:Contraparte>
          <sii:IDOtro>
            <sii:ID>${this.escapeXml(invoice.recipient.nif)}</sii:ID>
            <sii:IDType>02</sii:IDType>
            <sii:CodigoPais>${invoice.destinationCountry || 'XX'}</sii:CodigoPais>
          </sii:IDOtro>
          <sii:NombreRazon>${this.escapeXml(invoice.recipient.name)}</sii:NombreRazon>
        </sii:Contraparte>`
      : `<sii:Contraparte>
          <sii:NIF>${this.escapeXml(invoice.recipient.nif)}</sii:NIF>
          <sii:NombreRazon>${this.escapeXml(invoice.recipient.name)}</sii:NombreRazon>
        </sii:Contraparte>`;

    return `<sii:RegistroLRFacturasEmitidas>
      <sii:PeriodoImpositivo>
        <sii:Ejercicio>${new Date(invoice.invoiceId.issueDate).getFullYear()}</sii:Ejercicio>
        <sii:Periodo>${this.getPeriodFromDate(invoice.invoiceId.issueDate)}</sii:Periodo>
      </sii:PeriodoImpositivo>
      <sii:IDFactura>
        <sii:IDEmisorFactura>
          <sii:NIF>${this.escapeXml(invoice.issuer.nif)}</sii:NIF>
        </sii:IDEmisorFactura>
        <sii:NumSerieFacturaEmisor>${this.escapeXml(invoice.invoiceId.invoiceNumber)}</sii:NumSerieFacturaEmisor>
        <sii:FechaExpedicionFacturaEmisor>${this.formatDate(invoice.invoiceId.issueDate)}</sii:FechaExpedicionFacturaEmisor>
      </sii:IDFactura>
      <sii:FacturaExpedida>
        <sii:TipoFactura>${invoice.invoiceId.invoiceType}</sii:TipoFactura>
        ${rectification}
        <sii:ClaveRegimenEspecialOTrascendencia>${invoice.specialCircumstance || '01'}</sii:ClaveRegimenEspecialOTrascendencia>
        <sii:ImporteTotal>${this.formatAmount(invoice.totalInvoiceAmount)}</sii:ImporteTotal>
        <sii:DescripcionOperacion>${this.escapeXml(invoice.invoiceDescription)}</sii:DescripcionOperacion>
        ${counterpart}
        <sii:TipoDesglose>
          <sii:DesgloseFactura>
            ${vatLines}
          </sii:DesgloseFactura>
        </sii:TipoDesglose>
      </sii:FacturaExpedida>
    </sii:RegistroLRFacturasEmitidas>`;
  }

  /**
   * Build individual received invoice element
   */
  private buildReceivedInvoiceElement(invoice: SiiReceivedInvoice): string {
    const vatLines = invoice.vatLines
      .map((line) => this.buildVatLineElement(line, 'Recibida'))
      .join('\n');

    const counterpart = invoice.isIntracommunity
      ? `<sii:IDEmisorFactura>
          <sii:IDOtro>
            <sii:ID>${this.escapeXml(invoice.issuer.nif)}</sii:ID>
            <sii:IDType>02</sii:IDType>
            <sii:CodigoPais>${invoice.originCountry || 'XX'}</sii:CodigoPais>
          </sii:IDOtro>
        </sii:IDEmisorFactura>`
      : `<sii:IDEmisorFactura>
          <sii:NIF>${this.escapeXml(invoice.issuer.nif)}</sii:NIF>
        </sii:IDEmisorFactura>`;

    return `<sii:RegistroLRFacturasRecibidas>
      <sii:PeriodoImpositivo>
        <sii:Ejercicio>${new Date(invoice.invoiceId.issueDate).getFullYear()}</sii:Ejercicio>
        <sii:Periodo>${this.getPeriodFromDate(invoice.invoiceId.issueDate)}</sii:Periodo>
      </sii:PeriodoImpositivo>
      <sii:IDFactura>
        ${counterpart}
        <sii:NumSerieFacturaEmisor>${this.escapeXml(invoice.invoiceId.invoiceNumber)}</sii:NumSerieFacturaEmisor>
        <sii:FechaExpedicionFacturaEmisor>${this.formatDate(invoice.invoiceId.issueDate)}</sii:FechaExpedicionFacturaEmisor>
      </sii:IDFactura>
      <sii:FacturaRecibida>
        <sii:TipoFactura>${invoice.invoiceId.invoiceType}</sii:TipoFactura>
        <sii:ClaveRegimenEspecialOTrascendencia>${invoice.specialCircumstance || '01'}</sii:ClaveRegimenEspecialOTrascendencia>
        <sii:DescripcionOperacion>${this.escapeXml(invoice.invoiceDescription)}</sii:DescripcionOperacion>
        <sii:DesgloseFactura>
          ${vatLines}
        </sii:DesgloseFactura>
        ${invoice.deductibleAmount ? `<sii:CuotaDeducible>${this.formatAmount(invoice.deductibleAmount)}</sii:CuotaDeducible>` : ''}
      </sii:FacturaRecibida>
    </sii:RegistroLRFacturasRecibidas>`;
  }

  /**
   * Build VAT line element
   */
  private buildVatLineElement(
    line: SiiVatLine,
    invoiceDirection: 'Emitida' | 'Recibida',
  ): string {
    return `<sii:DetalleIVA>
      <sii:TipoImpositivo>${this.formatAmount(line.vatRate)}</sii:TipoImpositivo>
      <sii:BaseImponible>${this.formatAmount(line.taxableBase)}</sii:BaseImponible>
      <sii:CuotaRepercutida>${this.formatAmount(line.vatAmount)}</sii:CuotaRepercutida>
      ${line.equivalenceSurchargeRate ? `<sii:TipoRecargoEquivalencia>${this.formatAmount(line.equivalenceSurchargeRate)}</sii:TipoRecargoEquivalencia>` : ''}
      ${line.equivalenceSurchargeAmount ? `<sii:CuotaRecargoEquivalencia>${this.formatAmount(line.equivalenceSurchargeAmount)}</sii:CuotaRecargoEquivalencia>` : ''}
    </sii:DetalleIVA>`;
  }

  /**
   * Build payment element
   */
  private buildPaymentElement(payment: SiiPaymentRecord): string {
    return `<sii:RegistroLRCobrosMetalico>
      <sii:IDFactura>
        <sii:NumSerieFacturaEmisor>${this.escapeXml(payment.invoiceId.invoiceNumber)}</sii:NumSerieFacturaEmisor>
        <sii:FechaExpedicionFacturaEmisor>${this.formatDate(payment.invoiceId.issueDate)}</sii:FechaExpedicionFacturaEmisor>
      </sii:IDFactura>
      <sii:Cobro>
        <sii:FechaCobro>${this.formatDate(payment.paymentDate)}</sii:FechaCobro>
        <sii:ImporteCobrado>${this.formatAmount(payment.paymentAmount)}</sii:ImporteCobrado>
        <sii:Medio>${payment.paymentMethod}</sii:Medio>
        ${payment.accountOrReference ? `<sii:CuentaODatos>${this.escapeXml(payment.accountOrReference)}</sii:CuentaODatos>` : ''}
      </sii:Cobro>
    </sii:RegistroLRCobrosMetalico>`;
  }

  /**
   * Format date as DD-MM-YYYY
   */
  private formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Format amount to 2 decimal places
   */
  private formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  /**
   * Get period from date (MM format)
   */
  private getPeriodFromDate(date: Date): string {
    const month = new Date(date).getMonth() + 1;
    return String(month).padStart(2, '0');
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
