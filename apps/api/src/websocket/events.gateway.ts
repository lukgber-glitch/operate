import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { WsJwtGuard } from './ws-jwt.guard';
import {
  getOrgRoom,
  getUserRoom,
  WebSocketEvent,
  WebSocketPayload,
} from '@operate/shared';

/**
 * WebSocket Gateway for real-time updates
 * Handles connections, room management, and event broadcasting
 */
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/events',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(private configService: ConfigService) {}

  /**
   * Called after gateway initialization
   */
  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');

    // If Redis is configured, use Redis adapter for multi-instance support
    const redisHost = this.configService.get<string>('redis.host');
    if (redisHost) {
      this.setupRedisAdapter(server);
    }
  }

  /**
   * Handle new WebSocket connections
   */
  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Client attempting to connect: ${client.id}`);

      // Authentication is handled by WsJwtGuard
      // User data should be attached to client.data.user by the guard
      const user = client.data.user;

      if (!user) {
        this.logger.warn(`Unauthenticated client disconnected: ${client.id}`);
        client.disconnect();
        return;
      }

      // Join organization room
      const orgRoom = getOrgRoom(user.orgId);
      await client.join(orgRoom);

      // Join user-specific room
      const userRoom = getUserRoom(user.userId);
      await client.join(userRoom);

      this.logger.log(
        `Client connected: ${client.id} (User: ${user.userId}, Org: ${user.orgId})`,
      );

      // Send connection confirmation
      client.emit('connected', {
        message: 'Successfully connected to real-time updates',
        userId: user.userId,
        organizationId: user.orgId,
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`, error.stack);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    const user = client.data.user;
    this.logger.log(
      `Client disconnected: ${client.id}${user ? ` (User: ${user.userId})` : ''}`,
    );
  }

  /**
   * Subscribe to specific event types
   * Clients can use this to subscribe to particular event categories
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { events: WebSocketEvent[] },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    this.logger.log(
      `Client ${client.id} subscribed to events: ${data.events.join(', ')}`,
    );

    // Join event-specific rooms
    data.events.forEach((event) => {
      const eventRoom = `${getOrgRoom(user.orgId)}:${event}`;
      client.join(eventRoom);
    });

    return { success: true, subscribedTo: data.events };
  }

  /**
   * Unsubscribe from specific event types
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { events: WebSocketEvent[] },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    this.logger.log(
      `Client ${client.id} unsubscribed from events: ${data.events.join(', ')}`,
    );

    // Leave event-specific rooms
    data.events.forEach((event) => {
      const eventRoom = `${getOrgRoom(user.orgId)}:${event}`;
      client.leave(eventRoom);
    });

    return { success: true, unsubscribedFrom: data.events };
  }

  /**
   * Emit event to all clients in an organization
   */
  emitToOrganization(
    organizationId: string,
    event: WebSocketEvent,
    payload: WebSocketPayload,
  ) {
    const room = getOrgRoom(organizationId);
    this.server.to(room).emit(event, payload);
    this.logger.debug(`Emitted ${event} to organization ${organizationId}`);
  }

  /**
   * Emit event to a specific user
   */
  emitToUser(
    userId: string,
    event: WebSocketEvent,
    payload: WebSocketPayload,
  ) {
    const room = getUserRoom(userId);
    this.server.to(room).emit(event, payload);
    this.logger.debug(`Emitted ${event} to user ${userId}`);
  }

  /**
   * Emit event to all clients (admin/system-wide events)
   */
  emitToAll(event: WebSocketEvent, payload: WebSocketPayload) {
    this.server.emit(event, payload);
    this.logger.debug(`Emitted ${event} to all clients`);
  }

  /**
   * Setup Redis adapter for horizontal scaling
   * Allows WebSocket events to work across multiple server instances
   */
  private setupRedisAdapter(server: Server) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { createAdapter } = require('@socket.io/redis-adapter');
      const { createClient } = require('redis');

      const redisHost = this.configService.get<string>('redis.host');
      const redisPort = this.configService.get<number>('redis.port');
      const redisPassword = this.configService.get<string>('redis.password');
      const redisUsername = this.configService.get<string>('redis.username');

      const pubClient = createClient({
        socket: {
          host: redisHost,
          port: redisPort,
        },
        username: redisUsername,
        password: redisPassword,
      });

      const subClient = pubClient.duplicate();

      Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
        server.adapter(createAdapter(pubClient, subClient));
        this.logger.log('Redis adapter configured for WebSocket');
      });
    } catch (error) {
      this.logger.warn(
        'Redis adapter not available, running in single-instance mode',
      );
    }
  }
}
