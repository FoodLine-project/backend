import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { config } from 'dotenv';
import * as redisStore from 'cache-manager-ioredis';
import { RtRedisService } from './refresh-token.redis.service';

// const result = config();
// if (result.error) {
//   throw result.error;
// }

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: () => ({
        store: redisStore,
        host: process.env.RT_REDIS_HOST,
        port: process.env.RT_REDIS_PORT,
        username: process.env.RT_REDIS_USERNAME,
        password: process.env.RT_REDIS_PASSWORD,
        ttl: 604800,
      }),
    }),
  ],
  controllers: [],
  providers: [RtRedisService],
  exports: [RtRedisService],
})
export class RtRedisModule {}
