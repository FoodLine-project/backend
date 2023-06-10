import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { config } from 'dotenv';
import * as redisStore from 'cache-manager-ioredis';
import { RedisService } from './redis.service';

// const result = config();
// if (result.error) {
//   throw result.error;
// }

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: () => ({
        store: redisStore,
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
      }),
    }),
  ],
  controllers: [],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
