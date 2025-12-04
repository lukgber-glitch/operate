import { Module } from '@nestjs/common';
import { MindeeService } from './mindee.service';
import { MindeeController } from './mindee.controller';

/**
 * Mindee Receipt OCR Module
 * Provides receipt parsing capabilities using Mindee API
 */
@Module({
  controllers: [MindeeController],
  providers: [MindeeService],
  exports: [MindeeService],
})
export class MindeeModule {}
