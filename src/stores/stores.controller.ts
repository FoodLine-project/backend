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
import { LocationService } from 'src/location/location.service';
import { Stores } from './stores.entity';
import * as path from 'path';
import { CreateStoresDto } from './dto/create-stores.dto';
import { Public } from 'src/auth/common/decorators';
import { Cron } from '@nestjs/schedule';

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
    @Query('sortBy')
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
    return this.storesService.searchStores(keyword, sort, column);
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

  // @Patch('/:storeId/rating')
  // updateRating(@Param('storeId', ParseIntPipe) storeId: number): Promise<void> {
  //   return this.storesService.updateRating(storeId);
  // }

  @Public()
  @Cron('0 0 * * *')
  @Patch('/:storeId/rating')
  updateRating(@Param('storeId', ParseIntPipe) storeId: number): Promise<void> {
    const averageRating = this.storesService.updateRating(storeId);
    return averageRating;
  }
}

//카카오맵api 연동
// @Get('/:query')
//   async searchPlaces(@Param('query') query: string): Promise<any> {
//     const userLocation = await this.locationService.getCoordinatesOfIpAddress();

//     return await this.storesService.searchPlaces(query, userLocation);
//   }
