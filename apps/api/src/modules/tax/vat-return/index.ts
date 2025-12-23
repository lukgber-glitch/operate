/**
 * VAT Return Module Exports
 *
 * Note: Some types are defined in multiple places. We use explicit exports to avoid conflicts:
 * - ElsterKennzahlen, ElsterSubmissionRequest: defined in elster-xml-generator.service and types/elster.types
 * - VatReturnPreview: defined in types/vat-return.types and types/elster.types
 * - CreateVatReturnDto, ApproveVatReturnDto, SubmitVatReturnDto: defined in DTO classes and types/vat-return.types
 */

export * from './vat-return.module';
export * from './vat-return.service';
export * from './vat-return-preview.service';
export * from './vat-return.controller';
export * from './vat-calculation.service';
// Export elster-xml-generator.service except ElsterKennzahlen, ElsterSubmissionRequest (conflicts with types/elster.types)
export {
  ElsterOrganizationData,
  ElsterXmlOptions,
  ElsterXmlGeneratorService,
} from './elster-xml-generator.service';
// Export types - these export the canonical versions
export * from './types';
// DTO classes (interfaces in types/vat-return.types are superseded by these classes)
export * from './dto/create-vat-return.dto';
export * from './dto/approve-vat-return.dto';
export * from './dto/submit-vat-return.dto';
export * from './dto/reject-vat-return.dto';
