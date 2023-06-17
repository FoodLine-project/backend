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

@Module({
  providers: [CacheInterceptor],
  imports: [cacheModule],
  exports: [cacheModule],
})
export class CustomCacheModule {}
