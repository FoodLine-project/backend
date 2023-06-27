import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { StoresSearchDto } from './dto/search-stores.dto';
import { StoresService } from './stores.service';
import { Stores } from './stores.entity';
import * as path from 'path';
import { CreateStoresDto } from './dto/create-stores.dto';
import { Public } from '../auth/common/decorators';
import { CacheInterceptor } from 'src/cache/cache.interceptor';
import { searchRestaurantsDto } from './dto/search-restaurants.dto';
import { oneStoreDto } from './dto/getOne-store.dto';
import { MyLocation } from './dto/search-loc';

@Controller('stores')
export class StoresController {
  constructor(private storesService: StoresService) {}

  @UseInterceptors(CacheInterceptor)
  @Public()
  @Get('hot')
  async hotPlaces(): Promise<any[]> {
    return await this.storesService.hotPlaces();
  }

  @Public()
  @UseInterceptors(CacheInterceptor)
  @Post('/nearby-stores-rough')
  async searchRestaurants(
    @Body() coordinatesData: any,
    @Query('sort')
    sortBy?: 'distance' | 'name' | 'waitingCnt' | 'waitingCnt2' | 'rating',
  ): Promise<{ 근처식당목록: searchRestaurantsDto[] }> {
    const { swLatlng, neLatlng } = coordinatesData;
    const southWestLatitude = swLatlng.Ma;
    const southWestLongitude = swLatlng.La;
    const northEastLatitude = neLatlng.Ma;
    const northEastLongitude = neLatlng.La;

    //console.log(swLatlng.La, swLatlng.Ma, neLatlng.La, neLatlng.Ma);
    //geolocation 받고 그 가운데에 user위치;

    const restaurants = await this.storesService.searchRestaurants(
      southWestLatitude,
      southWestLongitude,
      northEastLatitude,
      northEastLongitude,
      sortBy,
    );
    return restaurants;
  }

  //elastic 주식탐
  @Public()
  @UseInterceptors(CacheInterceptor)
  @Post('/nearby-stores-elastic')
  async searchByCoordinates(
    @Body() coordinatesData: any,
    @Query('a') sort: 'ASC' | 'DESC' = 'ASC',
    @Query('b') column: string,
    @Query('c') page: number,
  ): Promise<any[]> {
    const { swLatlng, neLatlng, myLatitude, myLongitude } = coordinatesData;
    const southWestLatitude = swLatlng.Ma;
    const southWestLongitude = swLatlng.La;
    const northEastLatitude = neLatlng.Ma;
    const northEastLongitude = neLatlng.La;
    const restaurants = await this.storesService.searchByCoord(
      sort,
      column,
      page,
      southWestLatitude,
      southWestLongitude,
      northEastLatitude,
      northEastLongitude,
      myLatitude,
      myLongitude,
    );
    return restaurants;
  }

  //elastic, api/stores/search?keyword=햄버거 간단한 검색기능
  @Public()
  @UseInterceptors(CacheInterceptor)
  @Post('/search')
  async searchStores(
    @Body() myLocation: MyLocation,
    @Query('keyword') keyword: string,
    @Query('b') sort: 'ASC' | 'DESC' = 'ASC',
    @Query('a') column: string,
  ): Promise<StoresSearchDto[]> {
    const { myLatitude, myLongitude } = myLocation;
    return await this.storesService.searchStores2(
      keyword,
      sort,
      column,
      myLatitude,
      myLongitude,
    );
    // return this.storesService.searchByKeyword(keyword, sort, column);
  }

  // // Redis로 postgres 의 storeId 와 LA,MA 를 redis 에 저장
  // @Public()
  // @Post('/to-redis')
  // async addStoresToRedis(): Promise<void> {
  //   return await this.storesService.addStoresToRedis();
  // }

  // // Redis로 주식탐, 좌하단 우상단 좌표 내의 음식점 조회
  // @Public()
  // @Post('/nearby-stores-redis')
  // async getNearbyStoresByBox(
  //   @Body()
  //   coordinates: {
  //     swLatlng: { La: number; Ma: number };
  //     neLatlng: { La: number; Ma: number };
  //   },
  //   @Query('sort')
  //   sortBy?: 'distance' | 'name' | 'waitingCnt' | 'waitingCnt2' | 'rating',
  // ) {
  //   const stores = await this.storesService.getNearbyStoresByBox(
  //     coordinates,
  //     sortBy,
  //   );
  //   return stores;
  // }

  //Redis로 상세조회 (정보+댓글)
  @UseInterceptors(CacheInterceptor)
  @Public()
  @Get('/:storeId')
  getOneStore(
    @Param('storeId', ParseIntPipe) storeId: number,
  ): Promise<oneStoreDto> {
    return this.storesService.getOneStore(storeId);
  }

  // 상점 추가
  @Public()
  @Post('/')
  @UsePipes(ValidationPipe)
  createStore(@Body() createStoreDto: CreateStoresDto): Promise<Stores> {
    return this.storesService.createStore(createStoreDto);
  }

  //CSV파일 postgres 업로드
  @Public()
  @Post('/process')
  async processCSV(): Promise<void> {
    const inputFile = path.resolve('src/stores/csv/111.csv');
    await this.storesService.processCSVFile(inputFile);
  }

  //주소로 카카오에서 좌표 받아서 postgres업데이트
  @Public()
  @Post('update-coordinates')
  async updateCoordinates(): Promise<string> {
    await this.storesService.updateCoordinates();
    return 'Coordinates updated successfully';
  }
}

//카카오맵api 연동
// @Get('/:query')
//   async searchPlaces(@Param('query') query: string): Promise<any> {
//     const userLocation = await this.locationService.getCoordinatesOfIpAddress();

//     return await this.storesService.searchPlaces(query, userLocation);
//   }

// //postgres 의 coordinate 값을 채우는 api
// @Public()
// @Post('/fill-coordinates')
// async fillCoordinates() {
//   await this.storesService.fillCoordinates();
// }
