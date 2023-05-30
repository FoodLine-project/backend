import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { ReviewsRepository } from './reviews.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reviews } from './reviews.entity';
import { AuthModule } from 'src/auth/auth.module';
import { Users } from 'src/auth/users.entity';
import { UsersRepository } from 'src/auth/users.repository';
import { StoresRepository } from 'src/stores/stores.repository';
import { Tables } from 'src/tables/tables.entity';
import { TablesRepository } from 'src/tables/tables.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Reviews, Users, Tables]), AuthModule],
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
