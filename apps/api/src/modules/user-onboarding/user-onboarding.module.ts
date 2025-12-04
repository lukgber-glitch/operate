import { Module } from '@nestjs/common';
import { UserOnboardingController } from './user-onboarding.controller';
import { UserOnboardingService } from './user-onboarding.service';
import { DatabaseModule } from '../database/database.module';

/**
 * User Onboarding Module
 * Manages individual user onboarding flow and progress tracking
 */
@Module({
  imports: [DatabaseModule],
  controllers: [UserOnboardingController],
  providers: [UserOnboardingService],
  exports: [UserOnboardingService],
})
export class UserOnboardingModule {}
