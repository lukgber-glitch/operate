import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CraController } from './cra.controller';
import { CraService } from './cra.service';
import { CraAuthService } from './cra-auth.service';
import { CraNetFileClient } from './cra-netfile.client';
import { CraEfilerService } from './services/cra-efiler.service';
import { PrismaModule } from '../../database/prisma.module';

/**
 * CRA NetFile Integration Module
 *
 * Canada Revenue Agency e-filing integration
 *
 * Features:
 * - GST/HST return filing (GST34, GST62, GST106)
 * - Web Access Code authentication
 * - Return validation
 * - Filing status tracking
 * - Secure TLS 1.2+ communication
 * - Comprehensive audit logging
 */
@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [CraController],
  providers: [
    CraService,
    CraAuthService,
    CraNetFileClient,
    CraEfilerService,
  ],
  exports: [CraService],
})
export class CraModule {}
