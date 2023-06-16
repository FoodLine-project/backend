import { Module } from '@nestjs/common';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { config } from 'dotenv';

const result = config();
if (result.error) {
  throw result.error;
}

@Module({
  imports: [
    RedisModule.forRoot({
      readyLog: true,
      config: [
        {
          namespace: 'store',
          host: process.env.STORE_REDIS_HOST,
          port: Number(process.env.STORE_REDIS_PORT),
          password: process.env.STORE_REDIS_PASSWORD,
        },
        {
          namespace: 'waitingManager',
          host: process.env.WAITING_REDIS_HOST,
          port: Number(process.env.WAITING_REDIS_PORT),
          password: process.env.WAITING_REDIS_PASSWORD,
        },
        {
          namespace: 'local',
          host: 'redis-18535.c267.us-east-1-4.ec2.cloud.redislabs.com',
          port: 18535,
          password: 'KbFBdma9QCj0zuwcQkGcPRVPWh0467jX',
        },
      ],
    }),
  ],
})
export class CustomRedisModule { }
