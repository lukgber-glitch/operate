import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventsGateway } from './events.gateway';
import { WsJwtGuard } from './ws-jwt.guard';
import { EventsService } from './events.service';

/**
 * WebSocket Events Module
 * Provides real-time event broadcasting capabilities
 */
@Module({
  imports: [
    // JWT module for WebSocket authentication
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessSecret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.accessExpiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [EventsGateway, WsJwtGuard, EventsService],
  exports: [EventsService, EventsGateway], // Export service and gateway so other modules can emit events
})
export class EventsModule {}
