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
import { Tables } from '../tables/tables.entity';
import { TablesRepository } from '../tables/tables.repository';
import { Stores } from 'src/stores/stores.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reviews, Users, Stores, Tables]),
    AuthModule,
  ],
  controllers: [ReviewsController],
  providers: [
    ReviewsService,
    ReviewsRepository,
    UsersRepository,
    StoresRepository,
    TablesRepository,
  ],
})
export class ReviewsModule {}
