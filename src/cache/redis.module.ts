// src/cache/redis.module.ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';
import { RedisController } from './redis.controller';
import { RedisCacheService } from './redis.service';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import * as cacheManager from 'cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    //CacheModule resgister에 인자를 넘겨주어야 한다. (공식문서)
    CacheModule.register({
      store: redisStore,
      host: 'localhost',
      port: 6379,
    }),
  ],
  providers: [RedisCacheService],

  controllers: [RedisController],
})
export class RedisCacheModule {}

// @Module({
//   imports: [
//     //CacheModule resgister에 인자를 넘겨주어야 한다. (공식문서)
//     CacheModule.registerAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: () => ({
//         store: redisStore,
//         host: 'localhost',
//         port: 6379,
//         db: 0,
//         ttl: 10000,
//       }),
//     }),
//   ],
//   providers: [RedisCacheService],

//   controllers: [RedisController],
// })
// export class RedisCacheModule {}

//수정 로컬 redis
// store: redisStore,
// host: 'localhost', // env에서 정의함
// port: 6379, // env에서 정의함
// ttl: 604800,

//혜종님 서버
// store: redisStore,
// host: process.env.REDIS_HOST,
// port: parseInt(process.env.REDIS_PORT),
// auth_pass: process.env.REDIS_PASSWORD,
// ttl: 84600,

// const cacheModule = CacheModule.register({
//   useFactory: async () => ({
//     store: redisStore,
//     host: 'localhost',
//     port: 6379,
//     ttl: 100000,
//   }),
// });
