# Spain Reports Module

Comprehensive Spanish tax report generation system for Operate/CoachOS.

**Task:** W25-T4
**Market:** Spain (ES)
**Status:** ✅ Implemented (Modelo 303), 🔄 Pending (Modelo 390, 111, 347)

## Overview

This module handles the generation, validation, and submission of Spanish tax reports (modelos) required by the Agencia Estatal de Administración Tributaria (AEAT).

### Supported Reports

| Report | Name | Frequency | Status | Filing Deadline |
|--------|------|-----------|--------|-----------------|
| **Modelo 303** | Quarterly VAT Declaration | Quarterly | ✅ Implemented | 20th of following month |
| **Modelo 390** | Annual VAT Summary | Annual | 🔄 Stub only | January 30 |
| **Modelo 111** | Withholding Tax (IRPF) | Quarterly | 🔄 Stub only | 20th of following month |
| **Modelo 347** | Third-Party Operations | Annual | 🔄 Stub only | February 28 |

## Features

### Core Functionality
- ✅ Automatic calculation from invoice/expense data
- ✅ PDF preview generation (HTML-based)
- ✅ AEAT-compatible XML export
- ✅ Validation and deadline tracking
- ✅ Integration with SII (Spain SII module)
- ✅ Support for multiple VAT rates (21%, 10%, 4%)
- ✅ Intra-EU and export handling
- ✅ Investment goods vs current operations

### Modelo 303 (Quarterly VAT)
- Auto-calculates IVA collected (devengado) from issued invoices
- Auto-calculates IVA deductible (deducible) from received invoices
- Handles special cases:
  - Intra-community acquisitions
  - Imports
  - Investment goods
  - Exports (0% VAT)
  - Non-deductible expenses
- Generates boxes 01-48 per AEAT specification
- Calculates net result (to pay or to return)

## Architecture

### Services

```
SpainReportsModule
├── SpainReportsService (main orchestrator)
├── Modelo303Service (quarterly VAT)
├── Modelo390Service (annual VAT - stub)
├── Modelo111Service (withholding tax - stub)
├── Modelo347Service (third-party ops - stub)
├── SpainReportCalculatorService (tax calculations)
├── SpainReportXmlGeneratorService (AEAT XML)
└── SpainReportPdfGeneratorService (PDF preview)
```

### Data Flow

```
1. User Request
   ↓
2. SpainReportsService.generateReport()
   ↓
3. Modelo303Service.generate()
   ↓
4. Fetch invoices/expenses from DB (PrismaService)
   ↓
5. SpainReportCalculatorService.calculateModelo303()
   ↓
6. Generate PDF/XML (if requested)
   ↓
7. Return GenerateReportResponse
```

## Usage

### Basic Example

```typescript
import { SpainReportsService } from '@modules/reports/spain';

// Generate Modelo 303 for Q1 2024
const response = await spainReportsService.generateReport({
  orgId: 'org-123',
  type: SpainReportType.MODELO_303,
  period: {
    year: 2024,
    quarter: 1,
  },
  taxpayer: {
    nif: 'B12345678',
    name: 'Mi Empresa SL',
    fiscalYear: 2024,
    taxRegime: 'REGIMEN_GENERAL',
  },
  options: {
    includePreview: true,  // Generate PDF preview
    autoValidate: true,     // Validate calculations
    exportFormat: 'XML',    // Generate XML for AEAT
  },
});

// Access the report
const report = response.report as Modelo303Report;
console.log('Net result:', report.result.netResult);
console.log('To pay:', report.result.toPay);
console.log('To return:', report.result.toReturn);

// Get PDF preview (base64)
const pdfBase64 = response.preview?.pdfBase64;

// Get XML for AEAT submission
const xml = response.export?.xmlContent;
```

### Validate Report

```typescript
const validation = await spainReportsService.validateReport(reportId);

if (validation.isValid) {
  console.log('Report is valid!');
} else {
  console.error('Errors:', validation.errors);
}

if (validation.warnings.length > 0) {
  console.warn('Warnings:', validation.warnings);
}
```

### Generate XML Only

```typescript
const xml = await spainReportsService.generateXml(reportId);
// Submit to AEAT manually or via their web interface
```

### Generate PDF Only

```typescript
const pdfBuffer = await spainReportsService.generatePdf(reportId);
// Save or email the PDF
```

## Modelo 303 Box Mapping

The Modelo 303 uses official AEAT box numbers:

### IVA Devengado (Collected)
- **Box 01:** Base imponible 21%
- **Box 02:** Cuota IVA 21%
- **Box 03:** Base imponible 10%
- **Box 04:** Cuota IVA 10%
- **Box 05:** Base imponible 4%
- **Box 06:** Cuota IVA 4%
- **Box 10:** Base adquisiciones intracomunitarias
- **Box 11:** Cuota adquisiciones intracomunitarias
- **Box 27:** **Total cuota devengada**

### IVA Deducible (Deductible)
- **Box 12:** Base deducible operaciones corrientes
- **Box 13:** Cuota deducible operaciones corrientes
- **Box 14:** Base deducible bienes inversión
- **Box 15:** Cuota deducible bienes inversión
- **Box 16:** Cuota deducible importaciones
- **Box 17:** Cuota deducible adquisiciones intracomunitarias
- **Box 18:** Compensaciones régimen simplificado
- **Box 28:** **Total cuota deducible**

### Resultado (Result)
- **Box 29:** Resultado bruto (Box 27 - Box 28)
- **Box 30:** A deducir por prorrata
- **Box 31:** Regularización prorrata
- **Box 32:** A deducir devoluciones anteriores
- **Box 46:** **Resultado de la liquidación**
- **Box 47:** **A ingresar** (if positive)
- **Box 48:** **A devolver** (if negative)

## Filing Deadlines

### Modelo 303 (Quarterly)
- **Q1 (Jan-Mar):** April 1-20
- **Q2 (Apr-Jun):** July 1-20
- **Q3 (Jul-Sep):** October 1-20
- **Q4 (Oct-Dec):** January 1-30 (following year)

### Other Reports
- **Modelo 390:** January 1-30 (annual)
- **Modelo 111:** Same as 303 (quarterly)
- **Modelo 347:** February 1-28 (annual)

## Validation Rules

The system performs automatic validation:

### Required Fields
- Taxpayer NIF (must be valid Spanish NIF/CIF format)
- Fiscal year (2020-2100)
- Period (Q1-Q4 for quarterly reports)
- Total amounts must be non-negative

### Business Logic
- Total devengada must equal sum of individual quotas
- Total deducible must equal sum of individual quotas
- Deduction ratio > 95% triggers warning
- Refund > €10,000 triggers warning
- Deadline approaching/passed triggers warning

### NIF Validation
Supports all Spanish tax ID formats:
- **DNI/NIE:** 12345678Z, X1234567L
- **CIF:** B12345678 (companies)

## XML Format

The module generates AEAT-compatible XML in two formats:

### 1. SOAP Envelope (for SII integration)
```xml
<soapenv:Envelope>
  <soapenv:Body>
    <mod:Modelo303>
      <mod:Cabecera>
        <mod:NIF>B12345678</mod:NIF>
        <mod:Ejercicio>2024</mod:Ejercicio>
        <mod:Periodo>1T</mod:Periodo>
      </mod:Cabecera>
      <mod:IVADevengado>...</mod:IVADevengado>
      <mod:IVADeducible>...</mod:IVADeducible>
      <mod:Resultado>...</mod:Resultado>
    </mod:Modelo303>
  </soapenv:Body>
</soapenv:Envelope>
```

### 2. Simplified XML (for manual upload)
```xml
<Modelo303>
  <Identificacion>
    <NIF>B12345678</NIF>
    <Ejercicio>2024</Ejercicio>
    <Periodo>1T</Periodo>
  </Identificacion>
  <Boxes>
    <Box number="01">1000.00</Box>
    <Box number="02">210.00</Box>
    ...
  </Boxes>
</Modelo303>
```

## PDF Preview

The PDF generator creates a professional HTML-based preview that includes:
- Taxpayer information header
- Deadline warning
- All box sections (IVA Devengado, Deducible, Resultado)
- Visual summary of final result
- Metadata (invoice/expense count, calculation date)
- Footer with important notices

The HTML can be converted to PDF using Puppeteer (commented out in production code).

## Database Integration

The module automatically fetches data from the database:

### Issued Invoices (Sales)
```typescript
const invoices = await prisma.invoice.findMany({
  where: {
    orgId,
    date: { gte: quarterStart, lte: quarterEnd },
    status: { in: ['SENT', 'PAID', 'PARTIAL'] },
  },
  include: { items: true },
});
```

### Received Invoices (Expenses)
```typescript
const expenses = await prisma.expense.findMany({
  where: {
    orgId,
    date: { gte: quarterStart, lte: quarterEnd },
    status: { in: ['APPROVED', 'PAID'] },
  },
});
```

## Error Handling

The module defines specific error codes:

### Validation Errors (E303xxx)
- `E303001`: Invalid NIF
- `E303002`: Invalid period
- `E303003`: Invalid amount
- `E303004`: Missing required field

### Calculation Errors (E303010-E303019)
- `E303010`: Calculation mismatch
- `E303011`: Negative base
- `E303012`: Excessive deduction

### Business Logic Errors (E303020-E303029)
- `E303020`: No invoices found
- `E303021`: Period already filed
- `E303022`: Past deadline

### AEAT Submission Errors (E303030-E303039)
- `E303030`: AEAT rejection
- `E303031`: Certificate invalid
- `E303032`: Network error

## Testing

Run unit tests:
```bash
npm test modelo-303.service.spec.ts
```

Test coverage includes:
- ✅ Basic report generation
- ✅ IVA calculation accuracy
- ✅ Edge cases (zero invoices, intra-EU, exports)
- ✅ Validation logic
- ✅ Date range filtering
- ✅ Rounding and precision
- ✅ Investment goods vs current operations
- ✅ Non-deductible expenses

## Future Enhancements

### Modelo 390 (Annual VAT Summary)
- [ ] Aggregate all quarterly Modelo 303 reports
- [ ] Calculate annual totals
- [ ] Generate AEAT XML format

### Modelo 111 (Withholding Tax)
- [ ] Calculate IRPF withholdings from expenses
- [ ] Track professional services (15% rate)
- [ ] Support employee withholdings
- [ ] Generate quarterly declaration

### Modelo 347 (Third-Party Operations)
- [ ] Aggregate operations by third-party NIF
- [ ] Filter parties above €3,005.06 threshold
- [ ] Generate quarterly breakdowns
- [ ] Distinguish cash vs non-cash operations

### General Improvements
- [ ] Add Puppeteer PDF generation (production)
- [ ] Implement report persistence in database
- [ ] Add audit trail for report changes
- [ ] Support amended/corrected returns
- [ ] Email notifications for deadlines
- [ ] Batch processing for multiple periods
- [ ] Multi-tenancy support

## Dependencies

### Required Modules
- `DatabaseModule` - Prisma ORM for data access
- `SiiModule` - Spain SII integration

### External Libraries
- `xmlbuilder2` - XML generation
- `class-validator` - DTO validation
- `@nestjs/common` - NestJS core
- `@operate/shared` - Shared constants

### Optional (Production)
- `puppeteer` - PDF generation from HTML
- `@nestjs/bull` - Background job processing
- `@nestjs/schedule` - Deadline reminders

## Resources

### Official AEAT Documentation
- [Modelo 303 Information](https://www.agenciatributaria.es/AEAT.internet/Inicio/_Segmentos_/Empresas_y_profesionales/Empresas/IVA/Declaraciones/Modelo_303.shtml)
- [Modelo 390 Information](https://www.agenciatributaria.es/AEAT.internet/Inicio/_Segmentos_/Empresas_y_profesionales/Empresas/IVA/Declaraciones/Modelo_390.shtml)
- [SII Documentation](https://www.agenciatributaria.es/AEAT.internet/SII.html)

### Related Modules
- `spain-sii/` - SII invoice submission
- `spain-tax.config.ts` - Tax configuration
- `certificates/spain/` - Certificate management

## License

Proprietary - Operate/CoachOS
