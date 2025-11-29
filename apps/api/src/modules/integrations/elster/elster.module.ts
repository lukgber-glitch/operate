import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElsterController } from './elster.controller';
import { ElsterService } from './elster.service';
import { DatabaseModule } from '../../database/database.module';

/**
 * ELSTER Integration Module
 * Provides German tax filing capabilities through ELSTER API
 */
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
  ],
  controllers: [ElsterController],
  providers: [ElsterService],
  exports: [ElsterService],
})
export class ElsterModule {}
