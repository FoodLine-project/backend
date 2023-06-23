import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import * as redisStore from 'cache-manager-ioredis';
import { CacheInterceptor } from './cache.interceptor';

const cacheModule = CacheModule.registerAsync({
  useFactory: () => ({
    store: redisStore,
    host: process.env.CACHE_REDIS_HOST,
    port: Number(process.env.CACHE_REDIS_PORT),
    password: process.env.CACHE_REDIS_PASSWORD,
  }),
});

const cacheModule2 = CacheModule.registerAsync({
  useFactory: () => ({
    store: redisStore,
    host: process.env.EC2_REDIS_HOST,
    port: Number(process.env.EC2_REDIS_PORT),
  }),
});

@Module({
  providers: [CacheInterceptor],
  imports: [cacheModule2],
  exports: [cacheModule2],
})
export class CustomCacheModule {}
