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
import { LockService } from './lock/lock.service';

const result = config();
if (result.error) {
  throw result.error;
}

const redisOptions: RedisOptions = {
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
      redis: redisOptions,
    }),
    BullModule.registerQueue({
      name: 'waitingQueue',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
      // limiter: { max: 10, duration: 300 },
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
    LockService,
  ],
})
export class WaitingsModule {}
