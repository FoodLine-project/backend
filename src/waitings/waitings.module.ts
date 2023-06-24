import { Module } from '@nestjs/common';
import { WaitingsController } from './waitings.controller';
import { WaitingsService } from './waitings.service';
import { WaitingsRepository } from './waitings.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Waitings } from './waitings.entity';
import { AuthModule } from '../auth/auth.module';
import { StoresRepository } from '../stores/stores.repository';
import { ScheduleModule } from '@nestjs/schedule';
import { Stores } from '../stores/stores.entity';
import { BullModule } from '@nestjs/bull';
import { RedisOptions } from 'ioredis';
import { WaitingConsumer } from './waiting.consumer';
import { config } from 'dotenv';
import { CustomCacheModule } from '../cache/cache.module';
import { ReviewsRepository } from '../reviews/reviews.repository';
import { Reviews } from '../reviews/reviews.entity';

const result = config();
if (result.error) {
  throw result.error;
}

const redisOptions: RedisOptions = {
  host: process.env.BULL_REDIS_HOST,
  port: Number(process.env.BULL_REDIS_PORT),
  username: process.env.BULL_REDIS_USERNAME,
  password: process.env.BULL_REDIS_PASSWORD,
};

const redisOptions2: RedisOptions = {
  host: 'localhost',
  port: 6379,
};

const redisOptions3: RedisOptions = {
  host: process.env.CLOSE_REDIS_HOST,
  port: Number(process.env.CLOSE_REDIS_PORT),
  username: process.env.CLOSE_REDIS_USERNAME,
  password: process.env.CLOSE_REDIS_PASSWORD,
};

const redisOptions4: RedisOptions = {
  host: process.env.EC2_REDIS_HOST,
  port: Number(process.env.EC2_REDIS_PORT),
  password: process.env.EC2_REDIS_PASSWORD,
};

@Module({
  imports: [
    TypeOrmModule.forFeature([Waitings, Stores, Reviews], {
      type: 'spanner',
      maxQueryExecutionTime: 50000,
    }),
    AuthModule,
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: redisOptions4,
    }),
    BullModule.registerQueue({
      name: 'waitingQueue',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
      limiter: { max: 1, duration: 400 },
    }),
    CustomCacheModule,
  ],
  controllers: [WaitingsController],
  providers: [
    WaitingsService,
    WaitingsRepository,
    StoresRepository,
    WaitingConsumer,
    ReviewsRepository,
  ],
})
export class WaitingsModule {}
