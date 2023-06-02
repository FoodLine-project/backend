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

@Controller('places')
export class StoresController {
  constructor(
    private storesService: StoresService,
    private locationService: LocationService,
  ) {}

  //사용자 위치 기반 반경 1km내의 식당 조회
  @Public()
  @Post('/coordinates')
  async findResWithinRadius(
    @Body() coordinatesData: any,
  ): Promise<{ 근처식당목록: Stores[] }> {
    console.log(coordinatesData);
    const { swLatlng, neLatlng } = coordinatesData;
    return this.storesService.findResWithinRadius(
      swLatlng.Ma,
      swLatlng.La,
      neLatlng.Ma,
      neLatlng.La,
    );
  }

  //사용자 위치 기반 반경 1km내에 식당을 이름순으로 조회
  @Public()
  @Post('/coordinates-name')
  async findResWithName(
    @Body() coordinatesData: any,
  ): Promise<{ 근처식당목록: Stores[] }> {
    console.log(coordinatesData);
    const { swLatlng, neLatlng } = coordinatesData;
    return this.storesService.findResWithName(
      swLatlng.Ma,
      swLatlng.La,
      neLatlng.Ma,
      neLatlng.La,
    );
  }

  //웨이팅카운트 적은순으로 조회
  @Public()
  @Post('/coordinates-waitingcnt')
  async findResWithWaitingCnt(
    @Body() coordinatesData: any,
  ): Promise<{ 근처식당목록: Stores[] }> {
    console.log(coordinatesData);
    const { swLatlng, neLatlng } = coordinatesData;
    return this.storesService.findResWithWaitingCnt(
      swLatlng.Ma,
      swLatlng.La,
      neLatlng.Ma,
      neLatlng.La,
    );
  }

  //웨이팅카운트 많은순으로 조회
  @Public()
  @Post('/coordinates-waitingcnt2')
  async findResWithWaitingCnt2(
    @Body() coordinatesData: any,
  ): Promise<{ 근처식당목록: Stores[] }> {
    console.log(coordinatesData);
    const { swLatlng, neLatlng } = coordinatesData;
    return this.storesService.findResWithWaitingCnt2(
      swLatlng.Ma,
      swLatlng.La,
      neLatlng.Ma,
      neLatlng.La,
    );
  }

  //별점 높은 순으로 조회
  @Public()
  @Post('/coordinates-rating')
  async findResWithRating(
    @Body() coordinatesData: any,
  ): Promise<{ 근처식당목록: Stores[] }> {
    console.log(coordinatesData);
    const { swLatlng, neLatlng } = coordinatesData;
    return this.storesService.findResWithRating(
      swLatlng.Ma,
      swLatlng.La,
      neLatlng.Ma,
      neLatlng.La,
    );
  }

  ///api/stores/search?keyword=햄버거 간단한 검색기능
  @Public()
  @Get('/search')
  searchStores(@Query('keyword') keyword: string): Promise<StoresSearchDto[]> {
    return this.storesService.searchStores(keyword);
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

  @Patch('/:storeId/rating')
  updateRating(@Param('storeId', ParseIntPipe) storeId: number): Promise<void> {
    return this.storesService.updateRating(storeId);
  }
}

//카카오맵api 연동
// @Get('/:query')
//   async searchPlaces(@Param('query') query: string): Promise<any> {
//     const userLocation = await this.locationService.getCoordinatesOfIpAddress();

//     return await this.storesService.searchPlaces(query, userLocation);
//   }
