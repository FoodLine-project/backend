import { Controller, Get, Param, Inject, Query } from '@nestjs/common';
import { StoresSearchDto } from './dto/search-stores.dto';
import { StoresService } from './stores.service';


@Controller('places')
export class StoresController {
  constructor(private storesService: StoresService) { }

  @Get('/:query')
  async searchPlaces(@Param('query') query: string): Promise<any> {
    const userLocation = { latitude: 37.535744, longitude: 127.074304 }; // 사용자 위치 정보 입력

    const result = await this.storesService.searchPlaces(query, userLocation);
    // 여기서 결과를 처리하거나 필요한 로직을 추가하세요.
    return result;
  }


  ///api/stores/search?keyword=햄버거
  @Get('/search')
  searchStores(@Query('keyword') keyword: string): Promise<StoresSearchDto[]> {
    return this.storesService.searchStores(keyword);
  }

}
