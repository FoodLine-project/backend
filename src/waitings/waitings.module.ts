import { Module } from '@nestjs/common';
import { WaitingsController } from './waitings.controller';
import { WaitingsService } from './waitings.service';
import { WaitingsRepository } from './waitings.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Waitings } from './waitings.entity';
import { AuthModule } from 'src/auth/auth.module';
import { StoresRepository } from 'src/stores/stores.repository';
import { ScheduleModule } from '@nestjs/schedule';
import { TablesRepository } from 'src/tables/tables.repository';
import { Stores } from 'src/stores/stores.entity';
import { Tables } from 'src/tables/tables.entity';
import { BullModule } from '@nestjs/bull';
import { Redis, RedisOptions } from 'ioredis';
import { WaitingConsumer } from './waiting.consumer';

const redisOptions: RedisOptions = {
  host: 'redis-10555.c262.us-east-1-3.ec2.cloud.redislabs.com',
  port: 10555,
  username: `default`,
  password: `zxXBZoDFEW3cGnFA0tYMj0edC673xHhU`,
};
console.log(process.env.REDIS_HOST);
@Module({
  imports: [
    TypeOrmModule.forFeature([Waitings, Stores, Tables]),
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
