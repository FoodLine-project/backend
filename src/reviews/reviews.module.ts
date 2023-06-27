import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { ReviewsRepository } from './reviews.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reviews } from './reviews.entity';
import { AuthModule } from '../auth/auth.module';
import { Users } from '../auth/users.entity';
import { UsersRepository } from '../auth/users.repository';
import { StoresRepository } from '../stores/stores.repository';
import { Stores } from 'src/stores/stores.entity';
import { CustomCacheModule } from 'src/cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reviews, Users, Stores]),
    AuthModule,
    CustomCacheModule,
  ],
  controllers: [ReviewsController],
  providers: [
    ReviewsService,
    ReviewsRepository,
    UsersRepository,
    StoresRepository,
  ],
})
export class ReviewsModule { }
