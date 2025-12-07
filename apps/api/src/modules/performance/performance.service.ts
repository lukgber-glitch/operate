import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';

/**
 * Performance Service
 * Provides performance monitoring and metrics
 */
@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Get comprehensive performance metrics
   */
  async getPerformanceMetrics() {
    const [cache, database, system, api] = await Promise.all([
      this.getCacheStatistics(),
      this.getDatabaseStatistics(),
      this.getSystemStatistics(),
      this.getApiStatistics(),
    ]);

    return {
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      cache,
      database,
      system,
      api,
    };
  }

  /**
   * Get cache statistics
   */
  async getCacheStatistics() {
    try {
      const cacheStats = this.redis.getCacheStats();
      const redisInfo = await this.redis.getInfo();
      const isAlive = await this.redis.ping();

      return {
        status: isAlive ? 'healthy' : 'unhealthy',
        stats: cacheStats,
        redis: {
          version: redisInfo.server?.redis_version || 'unknown',
          uptime: redisInfo.server?.uptime_in_seconds || 0,
          connectedClients: redisInfo.clients?.connected_clients || 0,
          usedMemory: redisInfo.memory?.used_memory_human || 'unknown',
          usedMemoryPeak: redisInfo.memory?.used_memory_peak_human || 'unknown',
          evictedKeys: redisInfo.stats?.evicted_keys || 0,
          keyspaceHits: redisInfo.stats?.keyspace_hits || 0,
          keyspaceMisses: redisInfo.stats?.keyspace_misses || 0,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get cache statistics', error);
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStatistics() {
    try {
      const [queryMetrics, connectionInfo, tableSizes, indexStats] =
        await Promise.all([
          this.prisma.getQueryMetrics(),
          this.prisma.getConnectionInfo(),
          this.prisma.getTableSizes(),
          this.prisma.getIndexStats(),
        ]);

      const isHealthy = await this.prisma.healthCheck();

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        queryMetrics,
        connections: connectionInfo?.[0] || {
          total_connections: 0,
          active_connections: 0,
          idle_connections: 0,
        },
        topTables: tableSizes?.slice(0, 10) || [],
        topIndexes: indexStats?.slice(0, 10) || [],
      };
    } catch (error) {
      this.logger.error('Failed to get database statistics', error);
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Get system resource usage
   */
  getSystemStatistics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      nodejs: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      memory: {
        rss: this.formatBytes(memUsage.rss),
        heapTotal: this.formatBytes(memUsage.heapTotal),
        heapUsed: this.formatBytes(memUsage.heapUsed),
        external: this.formatBytes(memUsage.external),
        arrayBuffers: this.formatBytes(memUsage.arrayBuffers || 0),
        heapUsedPercentage: (
          (memUsage.heapUsed / memUsage.heapTotal) *
          100
        ).toFixed(2),
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      uptime: {
        process: this.formatUptime(process.uptime()),
        system: this.formatUptime(require('os').uptime()),
      },
    };
  }

  /**
   * Get API statistics
   * This is a placeholder - you would integrate with actual request tracking
   */
  async getApiStatistics() {
    // In a real implementation, you would track these metrics
    // using an interceptor or middleware
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      errorRate: 0,
      requestsPerMinute: 0,
      note: 'Implement request tracking interceptor for real-time data',
    };
  }

  /**
   * Get health check status
   */
  async getHealthCheck() {
    const [dbHealth, cacheHealth] = await Promise.all([
      this.prisma.healthCheck(),
      this.redis.ping(),
    ]);

    const isHealthy = dbHealth && cacheHealth;

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      checks: {
        database: dbHealth ? 'pass' : 'fail',
        cache: cacheHealth ? 'pass' : 'fail',
      },
    };
  }

  /**
   * Get application uptime
   */
  private getUptime() {
    const uptimeMs = Date.now() - this.startTime;
    return {
      milliseconds: uptimeMs,
      formatted: this.formatUptime(uptimeMs / 1000),
    };
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Format uptime in seconds to human readable format
   */
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);

    return parts.join(' ') || '0s';
  }
}
