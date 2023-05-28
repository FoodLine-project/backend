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
    const userLocation = await this.locationService.getCoordinatesOfIpAddress();

    return await this.storesService.searchPlaces(query, userLocation);
  }

  ///api/stores/search?keyword=햄버거
  @Get('/search')
  searchStores(@Query('keyword') keyword: string): Promise<StoresSearchDto[]> {
    return this.storesService.searchStores(keyword);
  }
}

//로직추가해버려