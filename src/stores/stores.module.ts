import { Module } from '@nestjs/common';
import { KakaoMapService } from './stores.service';
import { PlacesController } from './stores.controller';

@Module({
  providers: [KakaoMapService],
  controllers: [PlacesController],
})
export class AppModule {}
