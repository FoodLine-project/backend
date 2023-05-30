import { Module } from '@nestjs/common';

import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stores } from './stores.entity';
import { StoresRepository } from './stores.repository';
import { LocationService } from 'src/location/location.service';
import { Tables } from 'src/tables/tables.entity';
import { TablesRepository } from 'src/tables/tables.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Stores, Tables])],
  controllers: [StoresController],
  providers: [
    StoresService,
    LocationService,
    StoresRepository,
    TablesRepository,
  ],
})
export class StoresModule {}
