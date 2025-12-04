/**
 * Receipt Scanner Module
 * Integrates OCR (Mindee) with AI classification for receipt processing
 */

import { Module } from '@nestjs/common';
import { ReceiptScannerService } from './receipt-scanner.service';
import { DatabaseModule } from '../../../database/database.module';
import { ClassificationModule } from '../classification/classification.module';
import { AutomationModule } from '../../automation/automation.module';
import { ExpensesModule } from '../../finance/expenses/expenses.module';
import { WebsocketModule } from '../../../websocket/websocket.module';

@Module({
  imports: [
    DatabaseModule,
    ClassificationModule,
    AutomationModule,
    ExpensesModule,
    WebsocketModule,
    // TODO: Add MindeeModule when BRIDGE creates it
    // MindeeModule,
  ],
  providers: [ReceiptScannerService],
  exports: [ReceiptScannerService],
})
export class ReceiptScannerModule {}
