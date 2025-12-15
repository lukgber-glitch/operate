import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AutopilotController } from './autopilot.controller';
import { AutopilotService } from './autopilot.service';
import { AutopilotCronService } from './autopilot-cron.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, ScheduleModule.forRoot()],
  controllers: [AutopilotController],
  providers: [AutopilotService, AutopilotCronService],
  exports: [AutopilotService],
})
export class AutopilotModule {}
