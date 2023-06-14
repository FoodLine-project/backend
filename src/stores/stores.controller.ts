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
  Patch,
} from '@nestjs/common';
import { StoresSearchDto } from './dto/search-stores.dto';
import { StoresService } from './stores.service';
import { LocationService } from '../location/location.service';
import { Stores } from './stores.entity';
import * as path from 'path';
import { CreateStoresDto } from './dto/create-stores.dto';
import { Public } from '../auth/common/decorators';
@Controller('places')
export class StoresController {
  constructor(
    private storesService: StoresService,
    private locationService: LocationService,
  ) {}

  @Public()
  @Post('/coordinates')
  async searchRestaurants(
    @Body() coordinatesData: any,
    @Query('sort')
    sortBy?: 'distance' | 'name' | 'waitingCnt' | 'waitingCnt2' | 'rating',
  ): Promise<{ 근처식당목록: Stores[] }> {
    console.log(coordinatesData);
    const { swLatlng, neLatlng } = coordinatesData;
    const southWestLatitude = swLatlng.La;
    const southWestLongitude = swLatlng.Ma;
    const northEastLatitude = neLatlng.La;
    const northEastLongitude = neLatlng.Ma;

    //geolocation 받고 그 가운데에 user위치;

    const restaurants = await this.storesService.searchRestaurants(
      southWestLatitude,
      southWestLongitude,
      northEastLatitude,
      northEastLongitude,
      sortBy,
    );

    // FOR TEST
    {
      console.log(`주변 식당 수: ${restaurants.근처식당목록.length}`);

      const storeNames = [];
      for (const restaurant of restaurants.근처식당목록) {
        storeNames.push({
          이름: restaurant.storeName,
          거리: restaurant.distance,
          ID: restaurant.storeId,
        });
      }
      console.log(storeNames);
    }

    return restaurants;
  }

  ///api/stores/search?keyword=햄버거 간단한 검색기능
  @Public()
  @Get('/search')
  searchStores(
    @Query('keyword') keyword: string,
    @Query('b') sort: 'ASC' | 'DESC',
    @Query('a') column: string,
  ): Promise<StoresSearchDto[]> {
    console.log(column);
    return this.storesService.searchStores2(keyword, sort, column);
  }

  //CSV파일 postgres 업로드
  @Public()
  @Post('/process')
  async processCSV(): Promise<void> {
    const inputFile = path.resolve('../stores/csv/111.csv');
    await this.storesService.processCSVFile(inputFile);
  }

  //주소로 카카오에서 좌표 받아서 postgres업데이트

  @Public()
  @Post('update-coordinates')
  async updateCoordinates(): Promise<string> {
    await this.storesService.updateCoordinates();
    return 'Coordinates updated successfully';
  }

  @Public()
  @Get('/nearby-stores')
  async getStoresNearby(
    @Body() coordinates: { Ma: number; La: number },
    @Query('sort')
    sortBy?: 'distance' | 'name' | 'waitingCnt' | 'waitingCnt2' | 'rating',
  ) {
    const stores = await this.storesService.getStoresNearby(
      coordinates,
      sortBy,
    );

    {
      console.log(`주변 식당 수: ${stores.length}`);

      const storeNames = [];
      for (const store of stores) {
        storeNames.push({
          ID: store.storeId,
          이름: store.storeName,
          주소: store.address,
          거리: Math.floor(store.distance * 1000),
        });
      }
      console.log(storeNames);
    }

    return stores;
  }

  @Public()
  @Get('/nearby-stores2')
  async getStoresNearby2(
    @Body()
    coordinates: {
      swLatlng: { La: number; Ma: number };
      neLatlng: { La: number; Ma: number };
    },
    @Query('sort')
    sortBy?: 'distance' | 'name' | 'waitingCnt' | 'waitingCnt2' | 'rating',
  ) {
    const stores = await this.storesService.getStoresNearby2(
      coordinates,
      sortBy,
    );

    {
      console.log(`주변 식당 수: ${stores.length}`);

      const storeNames = [];
      for (const store of stores) {
        storeNames.push({
          ID: store.storeId,
          이름: store.storeName,
          주소: store.address,
          거리: Math.floor(store.distance * 1000),
        });
      }
      console.log(storeNames);
    }

    return stores;
  }

  //상세조회 (정보+댓글)
  @Public()
  @Get('/:storeId')
  getOneStore(
    @Param('storeId', ParseIntPipe) storeId: number,
  ): Promise<Stores> {
    return this.storesService.getOneStore(storeId);
  }

  //(임시) 만약 추가요청이 들어올시// 추후 수정 예정
  @Public()
  @Post('/')
  @UsePipes(ValidationPipe)
  createStore(@Body() createStoreDto: CreateStoresDto): Promise<Stores> {
    return this.storesService.createStore(createStoreDto);
  }

  @Patch('/:storeId/rating')
  updateRating(@Param('storeId', ParseIntPipe) storeId: number): Promise<void> {
    return this.storesService.updateRating(storeId);
  }

  @Public()
  @Post('/to-redis')
  async addStoresToRedis(): Promise<void> {
    return await this.storesService.addStoresToRedis();
  }

  @Public()
  @Get('/from-redis/:storeId')
  async getStorePos(
    @Param('storeId', ParseIntPipe) storeId: number,
  ): Promise<[longitude: string, latitude: string][]> {
    return await this.storesService.getStorePos(storeId);
  }
}

//카카오맵api 연동
// @Get('/:query')
//   async searchPlaces(@Param('query') query: string): Promise<any> {
//     const userLocation = await this.locationService.getCoordinatesOfIpAddress();

//     return await this.storesService.searchPlaces(query, userLocation);
//   }
