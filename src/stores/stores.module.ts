import { Module } from '@nestjs/common';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stores } from './stores.entity';
import { StoresRepository } from './stores.repository';
import { ReviewsRepository } from '../reviews/reviews.repository';
import { Reviews } from '../reviews/reviews.entity';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { CustomCacheModule } from 'src/cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stores, Reviews]),
    ElasticsearchModule.register({
      node: 'http://52.78.66.6:9200',
      maxRetries: 10,
      requestTimeout: 60000,
      pingTimeout: 60000,
    }),
    CustomCacheModule,
  ],
  controllers: [StoresController],
  providers: [StoresService, StoresRepository, ReviewsRepository],
})
export class StoresModule {}
