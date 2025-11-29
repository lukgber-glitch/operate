/**
 * GoBD Export Module - Index
 * Exports all public interfaces and classes
 */

// Module
export { GobdModule } from './gobd.module';

// Services
export { GobdService } from './gobd.service';
export { GobdBuilderService } from './gobd-builder.service';

// Controller
export { GobdController } from './gobd.controller';

// DTOs
export { CreateGobdExportDto } from './dto/create-gobd-export.dto';
export {
  GobdExportResponseDto,
  GobdExportListResponseDto,
  GobdExportListItemDto,
} from './dto/gobd-export-response.dto';

// Interfaces
export {
  DateRange,
  DocumentType,
  ExportFormat,
  GobdConfig,
  ExportStatus,
  ExportMetadata,
} from './interfaces/gobd-config.interface';

export {
  GobdIndex,
  TableDefinition,
  DataSupplier,
  MediaDefinition,
  VariableColumn,
  ForeignKey,
} from './interfaces/gobd-index.interface';

export {
  DocumentMetadata,
  DocumentPackage,
  AccountData,
  TransactionData,
  InvoiceData,
  CustomerData,
  SupplierData,
  DataTables,
  ChecksumEntry,
  ChecksumFile,
} from './interfaces/gobd-document.interface';

// Utils
export { GobdXmlBuilder } from './utils/gobd-xml-builder.util';
export { GobdHashUtil } from './utils/gobd-hash.util';
export { GobdPackagerUtil } from './utils/gobd-packager.util';
