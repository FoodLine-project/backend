import { Module } from '@nestjs/common';
import { WaitingsController } from './waitings.controller';
import { WaitingsService } from './waitings.service';
import { WaitingsRepository } from './waitings.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Waitings } from './waitings.entity';
import { AuthModule } from '../auth/auth.module';
import { StoresRepository } from '../stores/stores.repository';
import { ScheduleModule } from '@nestjs/schedule';
import { TablesRepository } from '../tables/tables.repository';
import { Stores } from '../stores/stores.entity';
import { Tables } from '../tables/tables.entity';
import { BullModule } from '@nestjs/bull';
import { RedisOptions } from 'ioredis';
import { WaitingConsumer } from './waiting.consumer';
import { config } from 'dotenv';
// import { RedisControllModule } from 'src/redis/redis.module';
// import { RedisService } from 'src/redis/redis.service';

const result = config();
if (result.error) {
  throw result.error;
}

const redisOptions: RedisOptions = {
  host: `${process.env.WAITING_REDIS_HOST}`,
  port: 10555,
  username: `${process.env.WAITING_REDIS_USERNAME}`,
  password: `${process.env.WAITING_REDIS_PASSWORD}`,
};
@Module({
  imports: [
    TypeOrmModule.forFeature([Waitings, Stores, Tables], {
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
    }),
  ],
  controllers: [WaitingsController],
  providers: [
    WaitingsService,
    WaitingsRepository,
    StoresRepository,
    TablesRepository,
    WaitingConsumer,
  ],
})
export class WaitingsModule {}
