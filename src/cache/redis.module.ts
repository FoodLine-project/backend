// src/cache/redis.module.ts
import { Module } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
import * as dotenv from 'dotenv';
import { RedisCacheService } from './redis.service';
import { CacheModule } from '@nestjs/cache-manager';

dotenv.config();

const cacheModule = CacheModule.register({
  useFactory: async () => ({
    store: redisStore,
    host: process.env.REDIS_HOST, // env에서 정의함
    port: parseInt(process.env.REDIS_PORT), // env에서 정의함
    password: process.env.REDIS_PASSWORD,
    ttl: 1000, // 캐시 유지 시간
  }),
});

@Module({
  imports: [cacheModule],
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class RedisCacheModule {}

// import { Module } from '@nestjs/common';
// import { AppController } from './redis.controller';
// import { AppService } from './redis.service';
// import { CacheModule} from '@nestjs/cache-manager'

// @Module({
//   imports: [
//     CacheModule.register({
//       isGlobal: true,
//     }),
//   ],
//   controllers: [AppController],
//   providers: [AppService],
// })
// export class AppModule {}
