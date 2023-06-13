import { Module } from '@nestjs/common';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { GeospatialService } from './geospatial.service';

@Module({
  imports: [
    RedisModule.forRoot({
      readyLog: true,
      config: {
        host: process.env.RT_REDIS_HOST,
        port: Number(process.env.RT_REDIS_PORT),
        password: process.env.RT_REDIS_PASSWORD,
      },
    }),
  ],
  providers: [GeospatialService],
  exports: [GeospatialService],
})
export class GeospatialModule {}
