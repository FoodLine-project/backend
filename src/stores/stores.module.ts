import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { Stores } from './stores.entity';
import { StoresRepository } from './stores.repository';
import { LocationService } from '../location/location.service';
import { Tables } from '../tables/tables.entity';
import { TablesRepository } from '../tables/tables.repository';
import { ReviewsRepository } from '../reviews/reviews.repository';
import { Reviews } from '../reviews/reviews.entity';
import * as dotenv from 'dotenv';
import { RedisCacheModule } from 'src/cache/redis.module';
import { RedisCacheService } from 'src/cache/redis.service';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';
import { RedisModule } from '@liaoliaots/nestjs-redis';

dotenv.config();

@Module({
  imports: [
    RedisCacheModule,
    CacheModule.register(),
    TypeOrmModule.forFeature([Stores, Tables, Reviews]),
    ElasticsearchModule.register({
      node: 'http://localhost:9200',
      maxRetries: 10,
      requestTimeout: 60000,
      pingTimeout: 60000,
      sniffOnStart: true,
    }),

    RedisModule.forRoot({
      readyLog: true,
      config: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
  controllers: [StoresController],
  providers: [
    StoresService,
    LocationService,
    StoresRepository,
    TablesRepository,
    ReviewsRepository,
    RedisCacheService,
  ],
})
export class StoresModule {}
