import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { StoresModule } from './stores/stores.module';
import { WaitingsModule } from './waitings/waitings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { TablesModule } from './tables/tables.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeORMConfig } from './configs/typeorm.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeORMConfig),
    UsersModule,
    StoresModule,
    WaitingsModule,
    ReviewsModule,
    TablesModule,
  ],
})
export class AppModule {}
