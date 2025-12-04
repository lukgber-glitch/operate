/**
 * Spain Reports Module Exports
 * Task: W25-T4
 */

// Module
export { SpainReportsModule } from './spain-reports.module';

// Main services
export { SpainReportsService } from './spain-reports.service';
export { Modelo303Service } from './modelo-303.service';
export { Modelo390Service } from './modelo-390.service';
export { Modelo111Service } from './modelo-111.service';
export { Modelo347Service } from './modelo-347.service';

// Utility services
export { SpainReportCalculatorService } from './spain-report-calculator.service';
export { SpainReportXmlGeneratorService } from './spain-report-xml-generator.service';
export { SpainReportPdfGeneratorService } from './spain-report-pdf-generator.service';

// Interfaces
export * from './interfaces/spain-report.interface';

// DTOs
export * from './dto/generate-report.dto';

// Constants
export * from './constants/modelo-303.constants';
