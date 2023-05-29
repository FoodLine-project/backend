import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { StoresModule } from './stores/stores.module';
import { WaitingsModule } from './waitings/waitings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { TablesModule } from './tables/tables.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeORMConfig } from './configs/typeorm.config';
import { LocationService } from './location/location.service';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenGuard } from './auth/guards';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeORMConfig),
    AuthModule,
    StoresModule,
    WaitingsModule,
    ReviewsModule,
    TablesModule,
  ],
  providers: [
    LocationService,
    {
      provide: APP_GUARD, // APP_GUARD: 애플리케이션의 전역 가드를 설정하는 토큰
      useClass: AccessTokenGuard, // AccessTokenGuard를 APP_GUARD에 등록
    },
  ],
})
export class AppModule {}
