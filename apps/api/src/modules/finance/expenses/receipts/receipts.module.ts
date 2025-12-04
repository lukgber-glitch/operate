import { Module, forwardRef } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ReceiptsController } from './receipts.controller';
import { RbacModule } from '../../../auth/rbac/rbac.module';
import { ExpensesModule } from '../expenses.module';

/**
 * Receipts Module
 * Handles receipt upload, OCR scanning, and expense creation from receipts
 *
 * Features:
 * - File upload with validation (images and PDFs)
 * - OCR integration (via BRIDGE's Mindee integration)
 * - AI classification (via ORACLE's receipt scanner)
 * - Expense creation from scan results
 * - Scan history and management
 */
@Module({
  imports: [
    // Configure Multer for file uploads
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
        ];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
            ),
            false,
          );
        }
      },
    }),
    RbacModule,
    forwardRef(() => ExpensesModule), // Use forwardRef to resolve circular dependency
  ],
  controllers: [ReceiptsController],
  providers: [
    // TODO: Add ReceiptsService when implemented
    // TODO: Add integration with BRIDGE (Mindee OCR)
    // TODO: Add integration with ORACLE (receipt classification)
  ],
  exports: [
    // TODO: Export ReceiptsService when implemented
  ],
})
export class ReceiptsModule {}
