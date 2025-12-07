import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

/**
 * Enhanced Prisma Service
 * Extends PrismaClient with additional features:
 * - Connection management
 * - Query logging and monitoring
 * - Soft delete middleware
 * - Performance metrics
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private queryCount = 0;
  private slowQueryCount = 0;
  private readonly slowQueryThreshold: number;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = configService.get<string>('database.url');
    const nodeEnv = configService.get<string>('nodeEnv');

    // Get slow query threshold from config (default: 100ms)
    const slowQueryThresholdMs = configService.get<number>(
      'database.slowQueryThreshold',
      100,
    );

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log:
        nodeEnv === 'development'
          ? [
              { level: 'query', emit: 'event' },
              { level: 'error', emit: 'stdout' },
              { level: 'warn', emit: 'stdout' },
              { level: 'info', emit: 'stdout' },
            ]
          : [
              { level: 'error', emit: 'stdout' },
              { level: 'warn', emit: 'stdout' },
            ],
      errorFormat: 'colorless',
    });

    this.slowQueryThreshold = slowQueryThresholdMs;
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Database connection established');

      // Setup query logging
      this.setupQueryLogging();

      // Enable soft delete middleware
      await this.enableSoftDelete();
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }

  /**
   * Setup query logging and performance monitoring
   */
  private setupQueryLogging(): void {
    // @ts-ignore - Event listener for query logging
    this.$on('query', (e: any) => {
      this.queryCount++;

      // Log slow queries
      if (e.duration > this.slowQueryThreshold) {
        this.slowQueryCount++;
        this.logger.warn(
          `Slow query detected (${e.duration}ms, threshold: ${this.slowQueryThreshold}ms)`,
        );
        this.logger.warn(`Query: ${e.query}`);
        this.logger.warn(`Params: ${e.params}`);
        this.logger.warn(`Target: ${e.target}`);

        // Log query plan for very slow queries (> 1s)
        if (e.duration > 1000) {
          this.logger.error(
            `CRITICAL: Very slow query detected (${e.duration}ms)`,
          );
        }
      }

      // Log queries in development
      if (this.configService.get<string>('nodeEnv') === 'development') {
        if (e.duration < this.slowQueryThreshold) {
          this.logger.debug(`Query (${e.duration}ms): ${e.query}`);
        }
      }
    });
  }

  /**
   * Enable soft delete functionality
   * Converts DELETE operations to UPDATE with deletedAt timestamp
   */
  async enableSoftDelete(): Promise<void> {
    this.$use(async (params, next) => {
      // Check incoming query type
      if (params.action === 'delete') {
        // Change action to update and set deleted_at
        params.action = 'update';
        params.args['data'] = { deletedAt: new Date() };
      }
      if (params.action === 'deleteMany') {
        params.action = 'updateMany';
        if (params.args.data !== undefined) {
          params.args.data['deletedAt'] = new Date();
        } else {
          params.args['data'] = { deletedAt: new Date() };
        }
      }

      return next(params);
    });

    this.logger.log('Soft delete middleware enabled');
  }

  /**
   * Get query performance metrics
   */
  getQueryMetrics() {
    return {
      totalQueries: this.queryCount,
      slowQueries: this.slowQueryCount,
      slowQueryThreshold: this.slowQueryThreshold,
      slowQueryPercentage:
        this.queryCount > 0
          ? ((this.slowQueryCount / this.queryCount) * 100).toFixed(2) + '%'
          : '0%',
    };
  }

  /**
   * Reset query metrics
   */
  resetQueryMetrics() {
    this.queryCount = 0;
    this.slowQueryCount = 0;
  }

  /**
   * Execute a raw query with logging
   */
  async executeRaw(query: string, params?: any[]): Promise<any> {
    const startTime = Date.now();
    try {
      const result = await this.$executeRawUnsafe(query, ...(params || []));
      const duration = Date.now() - startTime;

      if (duration > this.slowQueryThreshold) {
        this.logger.warn(`Slow raw query (${duration}ms): ${query}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Raw query failed: ${query}`, error);
      throw error;
    }
  }

  /**
   * Execute a query with logging
   */
  async queryRaw(query: string, params?: any[]): Promise<any> {
    const startTime = Date.now();
    try {
      const result = await this.$queryRawUnsafe(query, ...(params || []));
      const duration = Date.now() - startTime;

      if (duration > this.slowQueryThreshold) {
        this.logger.warn(`Slow query (${duration}ms): ${query}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Query failed: ${query}`, error);
      throw error;
    }
  }

  /**
   * Get database connection info
   */
  async getConnectionInfo(): Promise<any> {
    try {
      const result = await this.$queryRaw`
        SELECT
          count(*) as total_connections,
          sum(case when state = 'active' then 1 else 0 end) as active_connections,
          sum(case when state = 'idle' then 1 else 0 end) as idle_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;
      return result;
    } catch (error) {
      this.logger.error('Failed to get connection info', error);
      return null;
    }
  }

  /**
   * Get table sizes
   */
  async getTableSizes(): Promise<any> {
    try {
      const result = await this.$queryRaw`
        SELECT
          schemaname as schema,
          tablename as table,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
        ORDER BY size_bytes DESC
        LIMIT 20
      `;
      return result;
    } catch (error) {
      this.logger.error('Failed to get table sizes', error);
      return null;
    }
  }

  /**
   * Get index usage statistics
   */
  async getIndexStats(): Promise<any> {
    try {
      const result = await this.$queryRaw`
        SELECT
          schemaname,
          tablename,
          indexname,
          idx_scan as index_scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
        LIMIT 20
      `;
      return result;
    } catch (error) {
      this.logger.error('Failed to get index stats', error);
      return null;
    }
  }

  /**
   * Clean database connections for graceful shutdown
   */
  async cleanUpConnections(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database connections cleaned up');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return false;
    }
  }
}
