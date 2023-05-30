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

@Module({
  imports: [TypeOrmModule.forFeature([Reviews, Users]), AuthModule],
  controllers: [ReviewsController],
  providers: [
    ReviewsService,
    ReviewsRepository,
    UsersRepository,
    StoresRepository,
  ],
})
export class ReviewsModule {}
