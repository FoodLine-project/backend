import { Module } from '@nestjs/common';

import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stores } from './stores.entity';
import { StoresRepository } from './stores.repository';


@Module({

  imports: [TypeOrmModule.forFeature([Stores])],
  controllers: [StoresController],
  providers: [StoresService, StoresRepository],
})
export class StoresModule { }
