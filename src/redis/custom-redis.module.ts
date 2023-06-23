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
          namespace: 'ec2redis',
          host: process.env.EC2_REDIS_HOST,
          port: Number(process.env.EC2_REDIS_PORT),
          password: process.env.EC2_REDIS_PASSWORD,
        },
      ],
    }),
  ],
})
export class CustomRedisModule {}
