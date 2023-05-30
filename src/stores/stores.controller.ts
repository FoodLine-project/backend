import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { StoresSearchDto } from './dto/search-stores.dto';
import { StoresService } from './stores.service';
import { LocationService } from 'src/location/location.service';
import { Stores } from './stores.entity';
import path from 'path';
import { CreateStoresDto } from './dto/create-stores.dto';
import { Public } from 'src/auth/common/decorators';

@Controller('places')
export class StoresController {
  constructor(
    private storesService: StoresService,
    private locationService: LocationService,
  ) {}

  //사용자 위치 기반 반경 1km내의 식당 조회
  //localhost:3000/places/within-radius?latitudeSW=37.74812040537091&longitudeSW=126.7688923363321&latitudeNE=37.74970428169939&longitudeNE=126.77258647785946
  @Public()
  @Post('/coordinates')
  async findRestaurantsWithinRadius(
    @Body() coordinatesData: any,
  ): Promise<{ 근처식당목록: Stores[] }> {
    console.log(coordinatesData);
    const { swLatlng, neLatlng } = coordinatesData;
    return this.storesService.findRestaurantsWithinRadius(
      // latitudeSW,
      // longitudeSW,
      // latitudeNE,
      // longitudeNE,
      swLatlng.Ma,
      swLatlng.La,
      neLatlng.Ma,
      neLatlng.La,
      //La Ma 다시 정리해보기
      // swLatlng: { La: 126.7863104768037, Ma: 37.751676049306454 },
      // neLatlng: { La: 126.79999791927987, Ma: 37.7548534512587 }
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
  getOneStore(@Param('storeId') storeId: number): Promise<Stores> {
    return this.storesService.getOneStore(storeId);
  }

  //(임시) 만약 추가요청이 들어올시// 추후 수정 예정
  @Public()
  @Post('/')
  @UsePipes(ValidationPipe)
  createStore(@Body() createStoreDto: CreateStoresDto): Promise<Stores> {
    return this.storesService.createStore(createStoreDto);
  }
}

//카카오맵api 연동
// @Get('/:query')
//   async searchPlaces(@Param('query') query: string): Promise<any> {
//     const userLocation = await this.locationService.getCoordinatesOfIpAddress();

//     return await this.storesService.searchPlaces(query, userLocation);
//   }
