import { Module, forwardRef } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ReceiptsController } from './receipts.controller';
import { ReceiptsService } from './receipts.service';
import { RbacModule } from '../../../auth/rbac/rbac.module';
import { ExpensesModule } from '../expenses.module';
import { MindeeModule } from '../../../integrations/mindee/mindee.module';
import { PrismaModule } from '../../../../common/prisma/prisma.module';

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
    PrismaModule,
    MindeeModule,
    forwardRef(() => ExpensesModule), // Use forwardRef to resolve circular dependency
  ],
  controllers: [ReceiptsController],
  providers: [ReceiptsService],
  exports: [ReceiptsService],
})
export class ReceiptsModule {}
