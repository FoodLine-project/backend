import { ReviewsRepository } from './../reviews/reviews.repository';
import { Injectable } from '@nestjs/common';
import { Stores } from './stores.entity';
import { StoresRepository } from './stores.repository';
import * as geolib from 'geolib';
import { createReadStream } from 'fs';
import * as csvParser from 'csv-parser';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import {
  AggregationsAggregate,
  SearchResponse,
  float,
} from '@elastic/elasticsearch/lib/api/types';
import { CreateStoreDto, storeDto } from './dto';
import { validateCategory } from './types';

@Injectable()
export class StoresService {
  constructor(
    @InjectRedis('ec2redis') private readonly redisClient: Redis,
    private storesRepository: StoresRepository,
    private reviewsRepository: ReviewsRepository,

    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  //rating 가져오기
  async getRating(storeId: number): Promise<number> {
    const averageRating = await this.reviewsRepository.getAverageRating(
      storeId,
    );
    return averageRating;
  }

  //상점 추가
  async createStore(createUserDto: CreateStoreDto): Promise<Stores> {
    const store = await this.storesRepository.createStore(createUserDto);
    return store;
  }

  async getStoresWithinRange(
    stores: SearchResponse<string, Record<string, AggregationsAggregate>>,
    myLatitude: number,
    myLongitude: number,
  ): Promise<storeDto[]> {
    const resultStores: storeDto[] = await Promise.all(
      stores.hits.hits.map(async (hit: any) => {
        const storesFound = hit._source;
        const storeId: number = storesFound.storeid;
        const redisAll = await this.redisClient.hgetall(`store:${storeId}`);

        const latitude: number = storesFound.location.lat;
        const longitude: number = storesFound.location.lon;
        const start = { latitude: myLatitude, longitude: myLongitude };
        const end = { latitude, longitude };
        const distance = geolib.getDistance(start, end);

        let currentWaitingCnt: number;
        let rating: number;

        if (Object.keys(redisAll).length === 0) {
          currentWaitingCnt = 0;
          rating = await this.getRating(storeId);

          const data = {
            maxWaitingCnt: storesFound.maxWaitingCnt,
            cycleTime: storesFound.cycleTime,
            tableForTwo: storesFound.tableForTwo,
            tableForFour: storesFound.tableForFour,
            availableTableForTwo: storesFound.tableForTwo,
            availableTableForFour: storesFound.tableForFour,
            currentWaitingCnt,
            rating,
          };

          await this.redisClient.hset(`store:${storeId}`, data); //perfomance test needed
        } else {
          currentWaitingCnt = Number(redisAll.currentWaitingCnt);
          rating = Number(redisAll.rating);
        }

        return {
          ...storesFound,
          distance: distance + 'm',
          currentWaitingCnt,
          rating,
        };
      }),
    );

    resultStores.sort(
      (a, b) => parseFloat(a.distance) - parseFloat(b.distance),
    );

    return resultStores;
  }

  async searchByCategory(
    keyword: string,
    sort: 'ASC' | 'DESC' = 'ASC',
    column: string,
    myLatitude: float,
    myLongitude: float,
  ): Promise<storeDto[]> {
    const stores = await this.elasticsearchService.search<any>({
      index: 'geo4_test',
      size: 100,
      _source: [
        'storeid',
        'storename',
        'category',
        'maxwaitingcnt',
        'cycletime',
        'tablefortwo',
        'tableforfour',
        'newaddress',
        'location',
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
    });

    const resultStores = await this.getStoresWithinRange(
      stores,
      myLatitude,
      myLongitude,
    );

    return resultStores;
  }
  //Elastic - 키워드로 검색하기
  async searchByKeyword(
    keyword: string,
    sort: 'ASC' | 'DESC' = 'ASC',
    column: string,
    myLatitude: float,
    myLongitude: float,
  ): Promise<storeDto[]> {
    const pageSize = 1000;
    const stores = await this.elasticsearchService.search<any>({
      index: 'geo4_test',
      size: pageSize,
      _source: [
        'storeid',
        'storename',
        'category',
        'maxwaitingcnt',
        'cycletime',
        'tablefortwo',
        'tableforfour',
        'newaddress',
        'location',
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
    });
    const resultStores = await this.getStoresWithinRange(
      stores,
      myLatitude,
      myLongitude,
    );
    return resultStores;
  }

  //주변식당탐색
  async getNearByStoresRough(
    southWestLatitude: number,
    southWestLongitude: number,
    northEastLatitude: number,
    northEastLongitude: number,
    sortBy?: 'distance' | 'name' | 'waitingCnt' | 'waitingCnt2' | 'rating',
  ): Promise<{ 근처식당목록: storeDto[] }> {
    const stores = await this.storesRepository.findAll();

    const storesWithinRadius = stores.filter((stores) => {
      const withinLatitudeRange =
        Number(stores.lat) >= southWestLatitude &&
        Number(stores.lat) <= northEastLatitude;
      const withinLongitudeRange =
        Number(stores.lon) >= southWestLongitude &&
        Number(stores.lon) <= northEastLongitude;
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

    const resultStores: storeDto[] = await Promise.all(
      storesWithinRadius.map(async (stores) => {
        const distance = calculateDistance(userLocation, {
          latitude: Number(stores.lat),
          longitude: Number(stores.lon),
        });

        const storesHashes = await this.redisClient.hgetall(
          `store:${stores.storeId}`,
        );

        const currentWaitingCnt: number = storesHashes.currentWaitingCnt
          ? Number(storesHashes.currentWaitingCnt)
          : 0;
        const rating: number = storesHashes.rating
          ? Number(storesHashes.rating)
          : 0;

        const filteredStores: storeDto = {
          storeName: stores.storeName,
          rating,
          category: stores.category,
          newAddress: stores.newAddress,
          oldAddress: stores.oldAddress,
          currentWaitingCnt,
          distance: String(distance),
          tableForTwo: stores.tableForTwo,
          tableForFour: stores.tableForFour,
        };

        return filteredStores;
      }),
    );

    //정렬로직모음
    resultStores
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.storeName.toUpperCase() < b.storeName.toUpperCase() ? -1 : 1;
        } else if (sortBy === 'waitingCnt') {
          return a.currentWaitingCnt - b.currentWaitingCnt;
        } else if (sortBy === 'waitingCnt2') {
          return b.currentWaitingCnt - a.currentWaitingCnt;
        }
        return (parseFloat(a.distance) || 0) - (parseFloat(b.distance) || 0);
      })
      .slice(0, 20);

    return { 근처식당목록: resultStores };
  }

  //elastic 좌표로 주변 음식점 검색 (거리순)
  async getNearbyStoresWithElastic(
    sort: 'ASC' | 'DESC' = 'ASC',
    column: string,
    page: number,
    southWestLatitude: number,
    southWestLongitude: number,
    northEastLatitude: number,
    northEastLongitude: number,
    myLatitude: float,
    myLongitude: float,
  ): Promise<storeDto[]> {
    const stores = await this.elasticsearchService.search<string>({
      index: 'geo4_test',
      size: 100,
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

    const resultStores = await this.getStoresWithinRange(
      stores,
      myLatitude,
      myLongitude,
    );

    return resultStores;
  }

  // ROUGH (NOT IN USE)
  async searchStoresRough(
    keyword: string,
    sort: 'ASC' | 'DESC',
    column: string,
  ): Promise<storeDto[]> {
    if (validateCategory(keyword)) {
      if (keyword === '중식') {
        keyword = '중국식';
      } else if (keyword === '양식') {
        keyword = '경양식';
      }
    } else {
      const stores = await this.storesRepository.searchStoresRough(
        keyword,
        sort,
        column,
      );
      return stores;
    }
  }

  //Elastic - 카테고리로 검색하기
  async searchStoresWithElastic(
    keyword: string,
    sort: 'ASC' | 'DESC',
    column: string,
    myLatitude: float,
    myLongitude: float,
  ): Promise<storeDto[]> {
    if (validateCategory(keyword)) {
      if (keyword === '중식') {
        keyword = '중국식';
      } else if (keyword === '양식') {
        keyword = '경양식';
      }

      const stores = await this.searchByCategory(
        keyword,
        sort,
        column,
        myLatitude,
        myLongitude,
      );
      return stores;
    } else {
      const stores = await this.searchByKeyword(
        keyword,
        sort,
        column,
        myLatitude,
        myLongitude,
      );
      return stores;
    }
  }

  //redis사용한 상세조회 --- 최종판
  async getOneStore(storeId: number): Promise<storeDto> {
    const redisAll = await this.redisClient.hgetall(`store:${storeId}`);
    const store = await this.storesRepository.findStoreById(storeId);

    let currentWaitingCnt: number;
    let rating: number;

    //캐싱 예외. currenWaitingCnt/Ratings APi 분리
    if (Object.keys(redisAll).length === 0) {
      currentWaitingCnt = 0;
      rating = await this.getRating(storeId);
      const data = {
        ...store,
        availableTableForTwo: store.tableForTwo,
        availableTableForFour: store.tableForFour,
        cycleTime: store.cycleTime,
        currentWaitingCnt,
        rating,
      };
      await this.redisClient.hset(`store:${storeId}`, data);

      delete data.availableTableForTwo;
      delete data.availableTableForFour;
      delete data.cycleTime;
    } else {
      currentWaitingCnt = parseInt(redisAll.currentWaitingCnt);
      rating = Number(redisAll.rating);
    }

    return {
      ...store,
      currentWaitingCnt,
      rating,
    };
  }

  //추천식당 띄우기
  async getHotPlaces(): Promise<storeDto[]> {
    return this.storesRepository.getHotPlaces();
  }

  //CSV 부분
  async processCSVFile(inputFile: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const rows: string[] = [];

      createReadStream(inputFile, { encoding: 'utf-8' })
        .pipe(csvParser())
        .on('error', (error) => {
          console.error('Error reading CSV file:', error);
          reject(error);
        })
        .on('data', (row: string) => {
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
        const { newAddress, storeName, oldAddress, storeId } = store;

        try {
          let coordinates = await this.storesRepository.getCoordinate(
            null,
            newAddress,
          );

          if (!coordinates) {
            coordinates = await this.storesRepository.getCoordinate(
              null,
              oldAddress,
            );
          }
          if (!coordinates) {
            coordinates = await this.storesRepository.getCoordinate(
              storeName,
              null,
            );
          }

          if (!coordinates) continue;

          //La = y, Ma = x
          const lat = coordinates[0];
          const lon = coordinates[1];

          await this.storesRepository.updateCoord(lat, lon, storeId);

          console.log(
            `Updated coordinates for address: ${storeId},${storeName},${newAddress}${lat}, ${lon}`,
          );
        } catch (err) {
          console.error(
            `Error updating coordinates for address: ${storeId},${storeName},${newAddress}, ${oldAddress}`,
            err,
          );
        }
      }
    } catch (err) {
      console.error('Error occurred during database operation:', err);
    }
  }
}

//redis - storeId 랑 좌표 넣기
// async addStoresToRedis(): Promise<void> {
//   const stores = await this.storesRepository.findAll();
//   for (let i = 0; i < stores.length; i++) {
//     await this.client.geoadd(
//       'stores',
//       stores[i].lon,
//       stores[i].lat,
//       String(stores[i].storeId),
//     );
//     console.log(`${i + 1}번째 음식점 좌표 redis 저장 완료`);
//   }
// }

//redis - box 내의 음식점 조회
// async getNearbyStoresByBox(
//   coordinates: {
//     swLatlng: { La: number; Ma: number };
//     neLatlng: { La: number; Ma: number };
//   },
//   sortBy?: string,
// ): Promise<Stores[]> {
//   const { swLatlng, neLatlng } = coordinates;

//   const userLatitude: number = (swLatlng.La + neLatlng.La) / 2;
//   const userLongitude: number = (swLatlng.Ma + neLatlng.Ma) / 2;

//   const width = this.getDistanceWithCoordinates(
//     swLatlng.La,
//     swLatlng.Ma,
//     swLatlng.La,
//     neLatlng.Ma,
//   );
//   const height = this.getDistanceWithCoordinates(
//     swLatlng.La,
//     swLatlng.Ma,
//     neLatlng.La,
//     swLatlng.Ma,
//   );

//   const nearbyStores = await this.redisClient.geosearch(
//     'stores',
//     'FROMLONLAT',
//     userLongitude,
//     userLatitude,
//     'BYBOX',
//     width,
//     height,
//     'km',
//     'withdist',
//   );

//   const nearbyStoresIds = nearbyStores.map((store) => store[0]);
//   const nearbyStoresDistances = nearbyStores.map((store) => Number(store[1]));

//   const stores = await this.storesRepository.findStoresByIds(nearbyStoresIds);

//   const result = [];

//   stores.forEach(async (store) => {
//     const distance = Math.ceil(
//       nearbyStoresDistances[nearbyStoresIds.indexOf(String(store.storeId))] *
//         1000,
//     );

//     const storesHashes = await this.redisClient.hgetall(
//       `store:${store.storeId}`,
//     );

//     let currentWaitingCnt: string;

//     if (!storesHashes.currentWaitingCnt) {
//       currentWaitingCnt = '0';
//     }

//     result.push({
//       ...store,
//       distance,
//       currentWaitingCnt: Number(currentWaitingCnt),
//     });
//   });

//   return result.sort((a, b) => {
//     if (sortBy === 'name') {
//       return a.storeName.toUpperCase() < b.storeName.toUpperCase() ? -1 : 1;
//     } else if (sortBy === 'waitingCnt') {
//       return a.currentWaitingCnt - b.currentWaitingCnt;
//     } else if (sortBy === 'waitingCnt2') {
//       return b.currentWaitingCnt - a.currentWaitingCnt;
//     } else if (sortBy === 'rating') {
//       return b.rating - a.rating;
//     }
//     return a.distance - b.distance;
//   });
// }

//redis - 두 좌표 사이의 거리
// getDistanceWithCoordinates(
//   lat1: number,
//   lon1: number,
//   lat2: number,
//   lon2: number,
// ): number {
//   function toRadians(degrees: number): number {
//     return degrees * (Math.PI / 180);
//   }
//   const R = 6371;
//   const dLat = toRadians(lat2 - lat1);
//   const dLon = toRadians(lon2 - lon1);
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(toRadians(lat1)) *
//       Math.cos(toRadians(lat2)) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   const distance = R * c;
//   return distance;
// }

//postGis
//postgres 좌표 업데이트
// async fillCoordinates() {
//   const stores = await this.storesRepository.findAll();
//   for (let i = 0; i < stores.length; i++) {
//     await this.storesRepository.fillCoordinates(
//       stores[i],
//       stores[i].lon,
//       stores[i].lat,
//     );
//     console.log(`updated coordinates of ${stores[i].storeId}`);
//   }
// }
