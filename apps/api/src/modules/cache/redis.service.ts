import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Enhanced Redis Service
 * Provides advanced Redis caching functionality across the application
 *
 * Features:
 * - Basic get/set/delete operations
 * - Batch operations for better performance
 * - Pattern-based operations
 * - Atomic operations
 * - Cache statistics and monitoring
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis | null = null;
  private isConnected = false;
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(private readonly configService: ConfigService) {
    // Check if Redis is available
    const redisHost = this.configService.get<string>('redis.host');
    const redisEnabled = this.configService.get<boolean>('redis.enabled', true);

    if (!redisHost || !redisEnabled) {
      this.logger.warn(
        'Redis is not configured or disabled. Caching will be skipped.',
      );
      return;
    }

    try {
      this.client = new Redis({
        host: redisHost,
        port: this.configService.get<number>('redis.port'),
        username: this.configService.get<string>('redis.username'),
        password: this.configService.get<string>('redis.password'),
        db: this.configService.get<number>('redis.db'),
        retryStrategy: (times: number) => {
          // Only retry a few times before giving up
          if (times > 3) {
            this.logger.error(
              'Redis connection failed after 3 retries. Disabling cache.',
            );
            return null; // Stop retrying
          }
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: false, // Don't queue commands when offline
        lazyConnect: true, // Don't connect immediately
      });

      this.client.on('connect', () => {
        this.logger.log('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis client error', err);
        this.isConnected = false;
      });

      this.client.on('ready', () => {
        this.logger.log('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('close', () => {
        this.logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      // Attempt to connect
      this.client.connect().catch((err) => {
        this.logger.error(
          'Failed to connect to Redis. Caching will be disabled.',
          err,
        );
        this.isConnected = false;
        // Don't throw - allow app to continue without cache
      });
    } catch (error) {
      this.logger.error(
        'Failed to initialize Redis client. Caching will be disabled.',
        error,
      );
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        this.cacheMisses++;
        return null;
      }
      this.cacheHits++;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Failed to get key ${key} from cache`, error);
      return null;
    }
  }

  /**
   * Get multiple values from cache (batch operation)
   */
  async mget<T>(keys: string[]): Promise<Map<string, T>> {
    if (!this.client || !this.isConnected) {
      return new Map();
    }

    try {
      if (keys.length === 0) return new Map();

      const values = await this.client.mget(...keys);
      const result = new Map<string, T>();

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = values[i];
        if (key && value) {
          try {
            result.set(key, JSON.parse(value) as T);
            this.cacheHits++;
          } catch (e) {
            this.logger.error(`Failed to parse cached value for ${key}`, e);
          }
        } else {
          this.cacheMisses++;
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to get multiple keys from cache`, error);
      return new Map();
    }
  }

  /**
   * Set value in cache with optional TTL in seconds
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(`Failed to set key ${key} in cache`, error);
    }
  }

  /**
   * Set multiple values in cache with optional TTL (batch operation)
   */
  async mset(entries: Map<string, any>, ttl?: number): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      if (entries.size === 0) return;

      const pipeline = this.client.pipeline();

      for (const [key, value] of entries) {
        const serialized = JSON.stringify(value);
        if (ttl) {
          pipeline.setex(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      }

      await pipeline.exec();
    } catch (error) {
      this.logger.error(`Failed to set multiple keys in cache`, error);
    }
  }

  /**
   * Set value only if key doesn't exist (atomic operation)
   */
  async setnx(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        // Use ioredis options object syntax for SET with NX and EX
        const result = await this.client.set(key, serialized, 'EX', ttl, 'NX');
        return result === 'OK';
      } else {
        const result = await this.client.setnx(key, serialized);
        return result === 1;
      }
    } catch (error) {
      this.logger.error(`Failed to setnx key ${key} in cache`, error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete key ${key} from cache`, error);
    }
  }

  /**
   * Delete multiple keys from cache (batch operation)
   */
  async mdel(keys: string[]): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      if (keys.length === 0) return;
      await this.client.del(...keys);
    } catch (error) {
      this.logger.error(`Failed to delete multiple keys from cache`, error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check existence of key ${key}`, error);
      return false;
    }
  }

  /**
   * Get TTL for key
   */
  async ttl(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return -1;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Failed to get TTL for key ${key}`, error);
      return -1;
    }
  }

  /**
   * Delete keys by pattern
   */
  async delByPattern(pattern: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        return keys.length;
      }
      return 0;
    } catch (error) {
      this.logger.error(`Failed to delete keys by pattern ${pattern}`, error);
      return 0;
    }
  }

  /**
   * Get keys by pattern
   */
  async keys(pattern: string): Promise<string[]> {
    if (!this.client || !this.isConnected) {
      return [];
    }

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      this.logger.error(`Failed to get keys by pattern ${pattern}`, error);
      return [];
    }
  }

  /**
   * Increment counter
   */
  async incr(key: string, ttl?: number): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    try {
      const value = await this.client.incr(key);
      if (ttl && value === 1) {
        await this.client.expire(key, ttl);
      }
      return value;
    } catch (error) {
      this.logger.error(`Failed to increment key ${key}`, error);
      return 0;
    }
  }

  /**
   * Decrement counter
   */
  async decr(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    try {
      return await this.client.decr(key);
    } catch (error) {
      this.logger.error(`Failed to decrement key ${key}`, error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? (this.cacheHits / total) * 100 : 0;

    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      total,
      hitRate: hitRate.toFixed(2) + '%',
    };
  }

  /**
   * Reset cache statistics
   */
  resetCacheStats() {
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Get Redis info
   */
  async getInfo(): Promise<any> {
    if (!this.client || !this.isConnected) {
      return {};
    }

    try {
      const info = await this.client.info();
      return this.parseRedisInfo(info);
    } catch (error) {
      this.logger.error('Failed to get Redis info', error);
      return {};
    }
  }

  /**
   * Parse Redis INFO command output
   */
  private parseRedisInfo(info: string): any {
    const lines = info.split('\r\n');
    const result: any = {};
    let section = 'default';

    for (const line of lines) {
      if (line.startsWith('#')) {
        section = line.substring(2).toLowerCase();
        result[section] = {};
      } else if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (section && key) {
          result[section][key] = value;
        }
      }
    }

    return result;
  }

  /**
   * Get Redis client (for advanced operations)
   */
  getClient(): Redis | null {
    return this.client;
  }

  /**
   * Check if Redis is connected
   */
  isRedisConnected(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Ping Redis server
   */
  async ping(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Failed to ping Redis', error);
      return false;
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis client disconnected');
    }
  }
}
