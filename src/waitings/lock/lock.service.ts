import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class LockService {
  constructor(@InjectRedis('ec2redis') private readonly redisClient: Redis) {}

  async acquireLock(key: string): Promise<boolean> {
    const acquired = await this.redisClient.set(key, 'locked', 'NX');
    return acquired !== null;
  }

  async releaseLock(key: string): Promise<boolean> {
    const released = await this.redisClient.del(key);
    return released > 0;
  }
}
