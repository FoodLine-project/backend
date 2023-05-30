import { Module } from '@nestjs/common';
import { WaitingsController } from './waitings.controller';
import { WaitingsService } from './waitings.service';
import { WaitingsRepository } from './waitings.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Waitings } from './waitings.entity';
import { AuthModule } from 'src/auth/auth.module';
import { StoresRepository } from 'src/stores/stores.repository';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forFeature([Waitings]),
    AuthModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [WaitingsController],
  providers: [WaitingsService, WaitingsRepository, StoresRepository],
})
export class WaitingsModule {}
