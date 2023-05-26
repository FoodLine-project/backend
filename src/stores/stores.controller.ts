import { Controller, Get, Param, Query } from '@nestjs/common';
import { StoresSearchDto } from './dto/search-stores.dto';
import { StoresService } from './stores.service';
import { LocationService } from 'src/location/location.service';

@Controller('places')
export class StoresController {
  constructor(
    private storesService: StoresService,
    private locationService: LocationService,
  ) {}

  @Get('/:query')
  async searchPlaces(@Param('query') query: string): Promise<any> {
    const ipAddress = await this.locationService.getPublicIpAddress();
    // const userLocation = await this.locationService.getLatAndLonOfIpAddress(
    //   ipAddress,
    // );
    // const userLocation = { latitude: 37.535744, longitude: 127.074304 }; // 사용자 위치 정보 입력

    const userLocation = { latitude: ipAddress.lat, longitude: ipAddress.lon };

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

//로직추가해버려