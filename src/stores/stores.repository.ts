import { Injectable } from '@nestjs/common';
import { Repository, ILike, Point } from 'typeorm';
import { Stores } from './stores.entity';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateStoresDto } from './dto/create-stores.dto';
import { StoresSearchDto } from './dto/search-stores.dto';
import { float } from '@elastic/elasticsearch/lib/api/types';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import * as geolib from 'geolib';
import { ReviewsRepository } from 'src/reviews/reviews.repository';
@Injectable()
export class StoresRepository {
  constructor(@InjectRepository(Stores) private stores: Repository<Stores>,
    @InjectRedis('ec2redis') private readonly redisClient: Redis,

  ) { }

  //사용자 위치 기반 반경 1km내의 식당 조회를 위해 전체 데이터 조회
  async findAll(): Promise<Stores[]> {
    const result = await this.stores.find({ order: { storeId: 'ASC' } });
    return result;
  }

  //1차 햄버거 조회
  async searchStores(
    keyword: string,
    sort: 'ASC' | 'DESC',
    column: string,
  ): Promise<StoresSearchDto[]> {
    const searchStores = await this.stores.find({
      select: [
        'storeId',
        'storeName',
        'category',
        'maxWaitingCnt',
        'newAddress',
        'oldAddress',
      ],
      where: [
        { storeName: ILike(`${keyword}%`) },
        { newAddress: ILike(`%${keyword}%`) },
      ],
      order: column && sort ? { [column]: sort } : {},
    });

    return searchStores;
  }

  //카테고리 검색
  async searchByCategory(
    keyword: string,
    sort: 'ASC' | 'DESC',
    column: string,
    myLatitude: float,
    myLongitude: float,
  ): Promise<StoresSearchDto[]> {
    const query = await this.stores.find({
      select: [
        'storeId',
        'storeName',
        'category',
        'maxWaitingCnt',
        'newAddress',
        'lat',
        'lon',
        'cycleTime'
      ],
      where: [{ category: ILike(`${keyword}%`) }],
      order: column && sort ? { [column]: sort } : {},
      take: 100,
    });

    return query;
  }

  //cycleTime 가져오기
  async getCycleTimeByStoreId(storeId: number): Promise<number> {
    const store = await this.stores.findOne({
      where: { storeId },
    });
    return store.cycleTime;
  }

  //한개 찾기
  async findStoreById(storeId: number): Promise<Stores> {
    return await this.stores.findOne({ where: { storeId } });
  }

  //많이 찾기
  async findStoresByIds(ids: string[]): Promise<Stores[]> {
    return await this.stores
      .createQueryBuilder('store')
      .where('store.storeId = ANY(:ids)', { ids })
      .getMany();
  }

  //리뷰와 함께 상세 조회
  async getOneStore(storeId: number): Promise<Stores> {
    const store = await this.stores.findOne({
      where: { storeId },
    });

    return store;
  }

  //상점 추가
  async createStore(createStoreDto: CreateStoresDto): Promise<Stores> {
    const {
      storeName,
      newAddress,
      category,
      maxWaitingCnt,
      lon,
      lat,
      tableForTwo,
      tableForFour,
    } = createStoreDto;

    const store = this.stores.create({
      storeName,
      maxWaitingCnt,
      lat,
      lon,
      tableForFour,
      tableForTwo,
      category,
      newAddress,
    });

    await this.stores.save(store);
    return store;
  }

  //postgres 에서 좌표 넣기
  async fillCoordinates(store: Stores, Ma: number, La: number) {
    const coordinates: Point = {
      type: 'Point',
      coordinates: [Ma, La],
    };

    store.coordinates = coordinates;
    await this.stores.save(store);
  }

  //CSV 저장
  async processCSVFile(rows: any): Promise<void> {
    for (const rowData of rows) {
      {
        const lat = 0;
        const lon = 0;
        const maxWaitingCnt = 0;
        const tableForTwo = Math.floor(Math.random() * 10);
        const tableForFour = Math.floor(Math.random() * 10);
        const storeName = rowData['사업장명'];
        const category = rowData['위생업태명'];
        const newAddress = rowData['도로명전체주소'];
        const oldAddress = rowData['소재지전체주소'];

        const store = this.stores.create({
          storeName,
          maxWaitingCnt,
          lat,
          lon,
          tableForFour,
          tableForTwo,
          category,
          newAddress,
          oldAddress,
        });

        try {
          await this.stores.save(store);
          console.log(store.storeId, 'saved successfully');

          //console.log('Inserted', result, 'row:', store);
        } catch (error) {
          //console.error('Error occurred during insert:', error);
        }
      }
    }
  }

  //좌표를 위한 주소와 아이디
  async getStoreAddressId() {
    return await this.stores.find({
      select: ['storeId', 'storeName', 'newAddress', 'oldAddress'],
      where: { lon: 0, lat: 0 },
      order: { storeId: 'ASC' },
    });
  }
  //주소 넣고 좌표
  async getCoordinate(storeNmae: string, address: string): Promise<any> {
    try {
      if (!address && !storeNmae) {
        return null;
      }

      const query = address ? address : storeNmae;
      const encodedQuery = encodeURIComponent(query);

      const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodedQuery}`;
      // const restApiKey = '800b8fe2427efbffbef3bc6fe96a5464';
      const restApiKey = `${process.env.KAKAO_REST_API_KEY}`;
      const headers = { Authorization: 'KakaoAK ' + restApiKey };

      const response = await axios.get(url, { headers });

      const result = response.data;

      if (result.documents.length !== 0) {
        const resultAddress = result.documents[0].address;
        const coordinates = [resultAddress.y, resultAddress.x];

        return coordinates;
      } else {
        return null;
      }
    } catch (error) {
      throw new Error(
        'Error fetching coordinates from Kakao API: ' + error.message,
      );
    }
  }
  //저장
  async updateCoord(lat: number, lon: number, storeId: number): Promise<any> {
    await this.stores.update(storeId, { lat, lon });
  }

  async hotPlaces(): Promise<any[]> {
    return this.stores
      .createQueryBuilder('stores')
      .leftJoin('stores.waitings', 'waitings')
      .select('stores.storeId', 'storeId')
      .addSelect('stores.newAddress', 'newAddress')
      .addSelect('stores.storeName', 'storeName')
      .addSelect('COUNT(waitings.waitingId)', 'count')
      .groupBy('stores.storeId')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();
  }


}
