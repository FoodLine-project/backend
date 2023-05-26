import { Controller, Get, Param, Inject } from '@nestjs/common';
import { KakaoMapService } from './stores.service';

@Controller('places')
export class PlacesController {
  constructor(
    @Inject(KakaoMapService)
    private readonly kakaoMapService: KakaoMapService,
  ) {}

  @Get('/:query')
  async searchPlaces(@Param('query') query: string): Promise<any> {
    const userLocation = { latitude: 37.535744, longitude: 127.074304 }; // 사용자 위치 정보 입력

    const result = await this.kakaoMapService.searchPlaces(query, userLocation);
    // 여기서 결과를 처리하거나 필요한 로직을 추가하세요.
    return result;
  }
}

//로직추가해버려