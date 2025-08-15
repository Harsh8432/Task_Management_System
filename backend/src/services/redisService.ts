import Redis from 'ioredis';
import { logger } from '../utils/logger';

export class RedisService {
  private client: Redis;
  private isConnected = false;

  constructor() {
    const redisOptions: any = {
      host: process.env['REDIS_HOST'] || 'localhost',
      port: parseInt(process.env['REDIS_PORT'] || '6379'),
      db: parseInt(process.env['REDIS_DB'] || '0'),
      maxRetriesPerRequest: 3,
      lazyConnect: true
    };

    if (process.env['REDIS_PASSWORD']) {
      redisOptions.password = process.env['REDIS_PASSWORD'];
    }

    this.client = new Redis(redisOptions);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis client connected');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('error', (error: Error) => {
      this.isConnected = false;
      logger.error('Redis client error:', error);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn('Redis client connection closed');
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });

    this.client.on('end', () => {
      this.isConnected = false;
      logger.info('Redis client connection ended');
    });
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.quit();
    } catch (error) {
      logger.error('Failed to disconnect from Redis:', error);
    }
  }

  public async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error('Failed to set Redis key:', { key, error });
      throw error;
    }
  }

  public async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Failed to get Redis key:', { key, error });
      throw error;
    }
  }

  public async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      logger.error('Failed to delete Redis key:', { key, error });
      throw error;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Failed to check Redis key existence:', { key, error });
      throw error;
    }
  }

  public async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error('Failed to set Redis key TTL:', { key, ttl, error });
      throw error;
    }
  }

  public async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Failed to get Redis key TTL:', { key, error });
      throw error;
    }
  }

  // Refresh token management
  public async storeRefreshToken(userId: string, token: string, ttl: number = 604800): Promise<void> {
    const key = `refresh_token:${userId}`;
    await this.set(key, token, ttl);
  }

  public async getRefreshToken(userId: string): Promise<string | null> {
    const key = `refresh_token:${userId}`;
    return await this.get(key);
  }

  public async invalidateRefreshToken(userId: string): Promise<void> {
    const key = `refresh_token:${userId}`;
    await this.del(key);
  }

  // Rate limiting
  public async incrementRateLimit(key: string, ttl: number = 60): Promise<number> {
    try {
      const current = await this.client.incr(key);
      if (current === 1) {
        await this.client.expire(key, ttl);
      }
      return current;
    } catch (error) {
      logger.error('Failed to increment rate limit:', { key, error });
      throw error;
    }
  }

  public async getRateLimit(key: string): Promise<number> {
    try {
      const value = await this.client.get(key);
      return value ? parseInt(value) : 0;
    } catch (error) {
      logger.error('Failed to get rate limit:', { key, error });
      return 0;
    }
  }

  // Session management
  public async storeSession(sessionId: string, data: any, ttl: number = 3600): Promise<void> {
    const key = `session:${sessionId}`;
    await this.set(key, JSON.stringify(data), ttl);
  }

  public async getSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`;
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  public async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.del(key);
  }

  // Cache management
  public async setCache(key: string, data: any, ttl: number = 300): Promise<void> {
    const cacheKey = `cache:${key}`;
    await this.set(cacheKey, JSON.stringify(data), ttl);
  }

  public async getCache(key: string): Promise<any | null> {
    const cacheKey = `cache:${key}`;
    const data = await this.get(cacheKey);
    return data ? JSON.parse(data) : null;
  }

  public async invalidateCache(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(`cache:${pattern}`);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      logger.error('Failed to invalidate cache:', { pattern, error });
    }
  }

  // Health check
  public async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return this.isConnected;
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  // Get connection status
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Get Redis info
  public async getInfo(): Promise<any> {
    try {
      const info = await this.client.info();
      return info;
    } catch (error) {
      logger.error('Failed to get Redis info:', error);
      return null;
    }
  }
}

// Export singleton instance
export const redisClient = new RedisService();
