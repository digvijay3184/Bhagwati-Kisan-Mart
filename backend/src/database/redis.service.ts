import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const redisUrl = this.configService.get<string>('redis.url');
    if (!redisUrl) {
      this.logger.warn('REDIS_URL not configured. Redis caching & rate limiting disabled.');
      return;
    }

    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      });

      this.client.on('error', (err) => {
        this.logger.error(`Redis connection error: ${err.message}`);
      });

      this.client.connect().then(() => {
        this.logger.log('Connected to Upstash Redis successfully');
      }).catch((err) => {
        this.logger.error(`Failed to connect to Redis on boot: ${err.message}`);
      });
    } catch (error) {
      this.logger.error(`Error initializing Redis client: ${(error as Error).message}`);
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    if (!this.client) return 1;
    const count = await this.client.incr(key);
    if (count === 1 && ttlSeconds) {
      await this.client.expire(key, ttlSeconds);
    }
    return count;
  }

  async onModuleDestroy() {
    if (this.client) {
      this.logger.log('Disconnecting from Redis');
      this.client.disconnect();
    }
  }
}
