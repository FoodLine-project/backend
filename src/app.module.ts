import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { StoresModule } from './stores/stores.module';
import { WaitingsModule } from './waitings/waitings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { TablesModule } from './tables/tables.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeORMConfig } from './configs/typeorm.config';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenGuard } from './auth/guards';
import { LoggerMiddleware } from './middlewares/logger.middleware';
import { CustomRedisModule } from './redis/custom-redis.module';
import { config } from 'dotenv';
import { CustomCacheModule } from './cache/cache.module';
import { AppController } from './app/app.controller';

const result = config();
if (result.error) {
  throw result.error;
}

@Module({
  imports: [
    TypeOrmModule.forRoot(typeORMConfig),
    AuthModule,
    StoresModule,
    WaitingsModule,
    ReviewsModule,
    TablesModule,
    CustomRedisModule,
    CustomCacheModule,
  ],
  providers: [
    {
      provide: APP_GUARD, // APP_GUARD: 애플리케이션의 전역 가드를 설정하는 토큰
      useClass: AccessTokenGuard, // AccessTokenGuard를 APP_GUARD에 등록
    },
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
