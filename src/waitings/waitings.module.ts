import { Module } from '@nestjs/common';
import { WaitingsController } from './waitings.controller';
import { WaitingsService } from './waitings.service';
import { WaitingsRepository } from './waitings.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Waitings } from './waitings.entity';
import { UsersModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Waitings]), UsersModule],
  controllers: [WaitingsController],
  providers: [WaitingsService, WaitingsRepository],
})
export class WaitingsModule {}
