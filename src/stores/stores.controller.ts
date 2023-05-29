import { Controller, Get, Param, Query, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { StoresSearchDto } from './dto/search-stores.dto';
import { StoresService } from './stores.service';
import { LocationService } from 'src/location/location.service';
import { Stores } from './stores.entity';
import path from 'path';
import { CreateStoresDto } from './dto/create-stores.dto';

@Controller('places')
export class StoresController {
  constructor(
    private storesService: StoresService,
    private locationService: LocationService,
  ) { }

  @Get('/:query')
  async searchPlaces(@Param('query') query: string): Promise<any> {
    const userLocation = await this.locationService.getCoordinatesOfIpAddress();

    return await this.storesService.searchPlaces(query, userLocation);
  }

  ///api/stores/search?keyword=햄버거 간단한 검색기능
  @Get('/search')
  searchStores(@Query('keyword') keyword: string): Promise<StoresSearchDto[]> {
    return this.storesService.searchStores(keyword);
  }

  //CSV파일 postgres 업로드
  @Post('/process')
  async processCSV(): Promise<void> {
    const inputFile = path.resolve('src/stores/csv/111.csv');
    await this.storesService.processCSVFile(inputFile);
  }

  //주소로 카카오에서 좌표 받아서 postgres업데이트 
  @Post('update-coordinates')
  async updateCoordinates(): Promise<string> {
    await this.storesService.updateCoordinates();
    return 'Coordinates updated successfully';
  }
  //상세조회 (정보+댓글)
  @Get('/:storeId')
  getOneStore(@Param('storeId') storeId: number): Promise<Stores> {
    return this.storesService.getOneStore(storeId)
  }

  //(임시) 만약 추가요청이 들어올시// 추후 수정 예정
  @Post('/')
  @UsePipes(ValidationPipe)
  createStore(@Body() createStoreDto: CreateStoresDto): Promise<Stores> {
    return this.storesService.createStore(createStoreDto)
  }

}
