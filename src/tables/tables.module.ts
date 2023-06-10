import { Module } from '@nestjs/common';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';
import { TablesRepository } from './tables.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tables } from './tables.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tables])],
  controllers: [TablesController],
  providers: [TablesService, TablesRepository],
})
export class TablesModule {}
