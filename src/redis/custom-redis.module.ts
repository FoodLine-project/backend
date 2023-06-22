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
          namespace: 'refresh-token',
          host: process.env.REFRESH_TOKEN_REDIS_HOST,
          port: Number(process.env.REFRESH_TOKEN_REDIS_PORT),
          password: process.env.REFRESH_TOKEN_REDIS_PASSWORD,
        },
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
      ],
    }),
  ],
})
export class CustomRedisModule {}
