import { ReviewsRepository } from './../reviews/reviews.repository';
import { Injectable } from '@nestjs/common';
import { Stores } from './stores.entity';
import { CreateStoresDto } from './dto/create-stores.dto';
import { StoresSearchDto } from './dto/search-stores.dto';
import { StoresRepository } from './stores.repository';
import * as geolib from 'geolib';
import { createReadStream } from 'fs';
import * as csvParser from 'csv-parser';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { searchRestaurantsDto } from './dto/search-restaurants.dto';

@Injectable()
export class StoresService {
  constructor(
    @InjectRedis('store') private readonly client: Redis,
    @InjectRedis('waitingManager') private readonly redisClient: Redis,
    private storesRepository: StoresRepository,
    private reviewsRepository: ReviewsRepository,

    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  //주변식당탐색
  async searchRestaurants(
    southWestLatitude: number,
    southWestLongitude: number,
    northEastLatitude: number,
    northEastLongitude: number,
    sortBy?: 'distance' | 'name' | 'waitingCnt' | 'waitingCnt2' | 'rating',
  ): Promise<{ 근처식당목록: searchRestaurantsDto[] }> {
    const restaurants = await this.storesRepository.findAll();

    const restaurantsWithinRadius = restaurants.filter((restaurant) => {
      const withinLatitudeRange =
        Number(restaurant.lat) >= southWestLatitude &&
        Number(restaurant.lat) <= northEastLatitude;
      const withinLongitudeRange =
        Number(restaurant.lon) >= southWestLongitude &&
        Number(restaurant.lon) <= northEastLongitude;
      return withinLatitudeRange && withinLongitudeRange;
    });

    // 거리 계산 로직
    const calculateDistance = (
      source: { latitude: number; longitude: number },
      target: { latitude: number; longitude: number },
    ): number => {
      const latDiff = Math.abs(source.latitude - target.latitude);
      const lngDiff = Math.abs(source.longitude - target.longitude);
      const approximateDistance = Math.floor(
        latDiff * 111000 + lngDiff * 111000,
      );
      return approximateDistance;
    };

    //user위치에 따른 거리값을 모든 sort조건에 포함시켜준다
    //calculateDistance로 얻은 distance 값을 출력값에 포함시켜준다
    const userLocation = {
      latitude: southWestLatitude,
      longitude: southWestLongitude,
    };

    const restaurantsResult: searchRestaurantsDto[] = [];
    restaurantsWithinRadius.forEach(async (restaurant) => {
      const distance = calculateDistance(userLocation, {
        latitude: Number(restaurant.lat),
        longitude: Number(restaurant.lon),
      });

      const storesHashes = await this.redisClient.hgetall(
        `store:${restaurant.storeId}`,
      );

      let currentWaitingCnt: string;
      // let rating : string

      if (!storesHashes.currentWaitingCnt) {
        currentWaitingCnt = '0';
        // rating = '0'
      }

      restaurantsResult.push({
        ...restaurant,
        distance: distance,
        currentWaitingCnt: Number(currentWaitingCnt),
      });
    });

    //정렬로직모음
    restaurantsResult.sort((a, b) => {
      if (sortBy === 'distance') {
        return (a.distance || 0) - (b.distance || 0);
      } else if (sortBy === 'name') {
        return a.storeName.toUpperCase() < b.storeName.toUpperCase() ? -1 : 1;
      } else if (sortBy === 'waitingCnt') {
        return a.currentWaitingCnt - b.currentWaitingCnt;
      } else if (sortBy === 'waitingCnt2') {
        return b.currentWaitingCnt - a.currentWaitingCnt;
      }
      return 0;
    });

    return { 근처식당목록: restaurantsResult };
  }

  //sorting //쿼리 searching 따로

  //키워드로 검색부분 //sorting 추가 //전국 식당으로 //가장 가까운 순으로?
  async searchStores(
    keyword: string,
    sort: 'ASC' | 'DESC',
    column: string,
  ): Promise<StoresSearchDto[]> {
    const category = [
      '한식',
      '양식',
      '중식',
      '일식',
      '양식',
      '기타',
      '분식',
      '까페',
      '통닭',
      '식육',
      '횟집',
      '인도',
      '패스트푸드',
      '패밀리레스트랑',
      '김밥(도시락)',
      '소주방',
    ];
    if (category.includes(keyword)) {
      if (keyword === '중식') {
        keyword = '중국식';
      } else if (keyword === '양식') {
        keyword = '경양식';
      }
      const searchByCategory = await this.storesRepository.searchByCategory(
        keyword,
        sort,
        column,
      );
      return searchByCategory;
    } else {
      const searchStores = await this.storesRepository.searchStores(
        keyword,
        sort,
        column,
      );
      return searchStores;
    }
  }

  //상세조회 + 댓글
  async getOneStore(storeId: number): Promise<Stores> {
    const store = await this.storesRepository.getOneStore(storeId);
    return store;
  }

  //상점 추가
  async createStore(createUserDto: CreateStoresDto): Promise<Stores> {
    const store = await this.storesRepository.createStore(createUserDto);
    return store;
  }

  //rating 가져오기
  async getRating(storeId: number): Promise<number> {
    const averageRating = await this.reviewsRepository.getAverageRating(
      storeId,
    );
    return averageRating;
  }

  async searchStores2(
    keyword: string,
    sort: 'ASC' | 'DESC',
    column: string,
  ): Promise<StoresSearchDto[]> {
    const category = [
      '한식',
      '양식',
      '중식',
      '일식',
      '양식',
      '기타',
      '분식',
      '까페',
      '통닭',
      '식육',
      '횟집',
      '인도',
      '패스트푸드',
      '패밀리레스트랑',
      '김밥(도시락)',
      '소주방',
    ];
    //console.log('Check')
    if (category.includes(keyword)) {
      if (keyword === '중식') {
        keyword = '중국식';
      } else if (keyword === '양식') {
        keyword = '경양식';
      }
      //console.log("카테고리")
      const searchByCategory = await this.searchByCategory(
        keyword,
        sort,
        column,
      );
      return searchByCategory;
    } else {
      //console.log("키워드")
      const searchStores = await this.searchByKeyword(keyword, sort, column);
      return searchStores;
    }
  }
  async searchByCategory(
    keyword: string,
    sort: 'ASC' | 'DESC' = 'ASC',
    column: string,
  ): Promise<any[]> {
    const stores = await this.elasticsearchService.search<any>({
      index: 'category_index',
      _source: [
        'storeid',
        'storename',
        'category',
        'maxwaitingcnt',
        'cycletime',
        'tablefortwo',
        'tableforfour',
      ],
      sort: column
        ? [
            {
              [column.toLocaleLowerCase()]: {
                order: sort === 'ASC' ? 'asc' : 'desc',
              },
            },
          ]
        : undefined,
      query: {
        bool: {
          should: [
            {
              wildcard: {
                category: `*${keyword}*`,
              },
            },
          ],
        },
      },
      size: 10000,
    });
    const storesData = stores.hits.hits.map(async (hit) => {
      const storeDatas = hit._source;
      const storeId: number = storeDatas.storeid;
      const redisRating = await this.redisClient.hget(
        `store:${storeId}`,
        'rating',
      );
      if (redisRating == null) {
        const average: number = await this.getRating(storeId);
        const datas = {
          maxWaitingCnt: storeDatas.maxwaitingcnt,
          cycleTime: storeDatas.cycletime,
          tableForTwo: storeDatas.tablefortwo,
          tableForFour: storeDatas.tableforfour,
          availableTableForTwo: storeDatas.tablefortwo,
          availableTableForFour: storeDatas.tableforfour,
          rating: average,
        };

        await this.redisClient.hset(`store:${storeId}`, datas); //perfomance test needed
        const redisRating = average;
        return { ...storeDatas, redisRating };
      }
      return { ...storeDatas, redisRating };
    });
    const resolvedStoredDatas = await Promise.all(storesData);
    console.log(storesData);
    return resolvedStoredDatas;
  }
  //햄버거로 찾기
  async searchByKeyword(
    keyword: string,
    sort: 'ASC' | 'DESC' = 'ASC',
    column: string,
  ): Promise<any[]> {
    const stores = await this.elasticsearchService.search<any>({
      index: 'stores_index',
      _source: [
        'storeid',
        'storename',
        'category',
        'maxwaitingcnt',
        'cycletime',
        'tablefortwo',
        'tableforfour',
      ],
      sort: column
        ? [
            {
              [column.toLocaleLowerCase()]: {
                order: sort === 'ASC' ? 'asc' : 'desc',
              },
            },
          ]
        : undefined,
      query: {
        bool: {
          should: [
            {
              wildcard: {
                storename: `*${keyword}*`,
              },
            },
            {
              wildcard: {
                address: `*${keyword}*`,
              },
            },
          ],
        },
      },
      size: 10000,
    });
    const storesData = stores.hits.hits.map(async (hit) => {
      const storeDatas = hit._source;
      const storeId: number = storeDatas.storeid;
      const redisRating = await this.redisClient.hget(
        `store:${storeId}`,
        'rating',
      );
      if (redisRating == null) {
        const average: number = await this.getRating(storeId);
        const datas = {
          maxWaitingCnt: storeDatas.maxwaitingcnt,
          cycleTime: storeDatas.cycletime,
          tableForTwo: storeDatas.tablefortwo,
          tableForFour: storeDatas.tableforfour,
          availableTableForTwo: storeDatas.tablefortwo,
          availableTableForFour: storeDatas.tableforfour,
          rating: average,
        };
        await this.redisClient.hset(`store:${storeId}`, datas); //perfomance test needed
        const redisRating = average;
        return { ...storeDatas, redisRating };
      }
      return { ...storeDatas, redisRating };
    });
    const resolvedStoredDatas = await Promise.all(storesData);
    return resolvedStoredDatas;
  }

  //elastic 좌표로 주변 음식점 검색 (거리순)

  async searchByCoord(
    sort: 'ASC' | 'DESC' = 'ASC',
    column: string,
    page: number,
    southWestLatitude: number,
    southWestLongitude: number,
    northEastLatitude: number,
    northEastLongitude: number,
    myLatitude: string,
    myLongitude: string,
  ): Promise<any[]> {
    const pageSize = 1000;
    // const from = (page - 1) * pageSize;
    const stores = await this.elasticsearchService.search<any>({
      index: 'geo_test',
      size: pageSize,
      //  from: from,
      sort: column
        ? [
            {
              [column.toLocaleLowerCase()]: {
                order: sort === 'ASC' ? 'asc' : 'desc',
              },
            }, //다시 인덱싱 하면, 필요한 값만 넣어줄 예정 toLowerCase 안할것!
          ]
        : undefined,
      query: {
        geo_bounding_box: {
          location: {
            top_left: {
              lat: northEastLatitude, // 37.757791370664556
              lon: southWestLongitude, //126.79520112345595
            },
            bottom_right: {
              lat: southWestLatitude, // 37.754606432266826
              lon: northEastLongitude, //126.77778001399787
            },
          },
        },
      },
    });
    const result = await Promise.all(
      stores.hits.hits.map(async (hit: any) => {
        const storesFound = hit._source;
        const storeId: number = storesFound.storeid;
        const redisRating = await this.redisClient.hget(
          `store:${storeId}`,
          'rating',
        );
        if (redisRating == null) {
          const average: number = await this.getRating(storeId);
          const datas = {
            maxWaitingCnt: storesFound.maxwaitingcnt,
            cycleTime: storesFound.cycletime,
            tableForTwo: storesFound.tablefortwo,
            tableForFour: storesFound.tableforfour,
            availableTableForTwo: storesFound.tablefortwo,
            availableTableForFour: storesFound.tableforfour,
            rating: average,
          };
          await this.redisClient.hset(`store:${storeId}`, datas); //perfomance test needed
          const redisRating = average;
          const latitude: number = storesFound.location.lat;
          const longitude: number = storesFound.location.lon;
          const start = { latitude: myLatitude, longitude: myLongitude };
          const end = { latitude: latitude, longitude: longitude };
          const distance = geolib.getDistance(start, end);
          return { ...storesFound, distance: distance + 'm', redisRating };
        }
        const latitude: number = storesFound.location.lat;
        const longitude: number = storesFound.location.lon;
        const start = { latitude: myLatitude, longitude: myLongitude };
        const end = { latitude: latitude, longitude: longitude };
        const distance = geolib.getDistance(start, end);
        return { ...storesFound, distance: distance + 'm', redisRating };
      }),
    );

    result.sort((a, b) => {
      const distanceA = parseFloat(a.distance);
      const distanceB = parseFloat(b.distance);
      return distanceA - distanceB;
    });
    console.log(result);
    return result;
  }

  //redis 에 storeId 랑 좌표 넣기
  async addStoresToRedis(): Promise<void> {
    const stores = await this.storesRepository.findAll();
    for (let i = 0; i < stores.length; i++) {
      await this.client.geoadd(
        'stores',
        stores[i].lon,
        stores[i].lat,
        String(stores[i].storeId),
      );
      console.log(`${i + 1}번째 음식점 좌표 redis 저장 완료`);
    }
  }

  //두 좌표 사이의 거리
  getDistanceWithCoordinates(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    function toRadians(degrees: number): number {
      return degrees * (Math.PI / 180);
    }
    const R = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  //box 내의 음식점 조회
  async getNearbyStoresByBox(
    coordinates: {
      swLatlng: { La: number; Ma: number };
      neLatlng: { La: number; Ma: number };
    },
    sortBy?: string,
  ): Promise<Stores[]> {
    const { swLatlng, neLatlng } = coordinates;

    const userLatitude: number = (swLatlng.La + neLatlng.La) / 2;
    const userLongitude: number = (swLatlng.Ma + neLatlng.Ma) / 2;

    const width = this.getDistanceWithCoordinates(
      swLatlng.La,
      swLatlng.Ma,
      swLatlng.La,
      neLatlng.Ma,
    );
    const height = this.getDistanceWithCoordinates(
      swLatlng.La,
      swLatlng.Ma,
      neLatlng.La,
      swLatlng.Ma,
    );

    const nearbyStores = await this.client.geosearch(
      'stores',
      'FROMLONLAT',
      userLongitude,
      userLatitude,
      'BYBOX',
      width,
      height,
      'km',
      'withdist',
    );

    const nearbyStoresIds = nearbyStores.map((store) => store[0]);
    const nearbyStoresDistances = nearbyStores.map((store) => Number(store[1]));

    const stores = await this.storesRepository.findStoresByIds(nearbyStoresIds);

    const result = [];

    stores.forEach(async (store) => {
      const distance = Math.ceil(
        nearbyStoresDistances[nearbyStoresIds.indexOf(String(store.storeId))] *
          1000,
      );

      const storesHashes = await this.redisClient.hgetall(
        `store:${store.storeId}`,
      );

      let currentWaitingCnt: string;

      if (!storesHashes.currentWaitingCnt) {
        currentWaitingCnt = '0';
      }

      result.push({
        ...store,
        distance,
        currentWaitingCnt: Number(currentWaitingCnt),
      });
    });

    return result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.storeName.toUpperCase() < b.storeName.toUpperCase() ? -1 : 1;
      } else if (sortBy === 'waitingCnt') {
        return a.currentWaitingCnt - b.currentWaitingCnt;
      } else if (sortBy === 'waitingCnt2') {
        return b.currentWaitingCnt - a.currentWaitingCnt;
      } else if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      return a.distance - b.distance;
    });
  }

  //postGis
  //postgres 좌표 업데이트
  async fillCoordinates() {
    const stores = await this.storesRepository.findAll();
    for (let i = 0; i < stores.length; i++) {
      await this.storesRepository.fillCoordinates(
        stores[i],
        stores[i].lon,
        stores[i].lat,
      );
      console.log(`updated coordinates of ${stores[i].storeId}`);
    }
  }

  //CSV 부분
  async processCSVFile(inputFile: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const rows: any[] = [];

      createReadStream(inputFile, { encoding: 'utf-8' })
        .pipe(csvParser())
        .on('error', (error) => {
          console.error('Error reading CSV file:', error);
          reject(error);
        })
        .on('data', (row: any) => {
          rows.push(row);
        })
        .on('end', async () => {
          await this.storesRepository.processCSVFile(rows);
          resolve();
        })
        .on('finish', () => {
          console.log('CSV processing completed.');
        });
    });
  }

  //카카오 좌표 부분
  async updateCoordinates(): Promise<void> {
    try {
      const stores = await this.storesRepository.getStoreAddressId();

      for (const store of stores) {
        const { newAddress, oldAddress, storeId } = store;

        try {
          let coordinates = await this.storesRepository.getCoordinate(
            newAddress,
          );

          if (!coordinates) {
            coordinates = await this.storesRepository.getCoordinate(oldAddress);
          }
          if (!coordinates) continue;

          //La = y, Ma = x
          const lat = coordinates[0];
          const lon = coordinates[1];

          await this.storesRepository.updateCoord(lat, lon, storeId);

          //console.log(
          //`Updated coordinates for address: ${address}`,
          //La,
          //Ma,
          //storeId,
          //);
        } catch (error) {
          //console.error(
          //`Error updating coordinates for address: ${address} and ${oldAddress}`,
          //error,
          //);
        }
      }
    } catch (error) {
      //console.error('Error occurred during database operation:', error);
    }
  }
}
