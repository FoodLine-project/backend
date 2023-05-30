import { Module } from '@nestjs/common';
import { WaitingsController } from './waitings.controller';
import { WaitingsService } from './waitings.service';
import { WaitingsRepository } from './waitings.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Waitings } from './waitings.entity';
import { AuthModule } from 'src/auth/auth.module';
import { StoresRepository } from 'src/stores/stores.repository';
import { ScheduleModule } from '@nestjs/schedule';
import { TablesRepository } from 'src/tables/tables.repository';
import { Stores } from 'src/stores/stores.entity';
import { Tables } from 'src/tables/tables.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Waitings, Stores, Tables]),
    AuthModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [WaitingsController],
  providers: [
    WaitingsService,
    WaitingsRepository,
    StoresRepository,
    TablesRepository,
  ],
})
export class WaitingsModule {}
