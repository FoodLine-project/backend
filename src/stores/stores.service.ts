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
import { oneStoreDto } from './dto/getOne-store.dto';
import { float } from '@elastic/elasticsearch/lib/api/types';

@Injectable()
export class StoresService {
  constructor(
    // @InjectRedis('store') private readonly client: Redis,
    @InjectRedis('ec2redis') private readonly redisClient: Redis,
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
    const restaurantsResult: searchRestaurantsDto[] = await Promise.all(
      restaurantsWithinRadius.map(async (restaurant) => {
        const distance = calculateDistance(userLocation, {
          latitude: Number(restaurant.lat),
          longitude: Number(restaurant.lon),
        });

        const storesHashes = await this.redisClient.hgetall(
          `store:${restaurant.storeId}`,
        );

        let currentWaitingCnt: string;
        let rating: string;

        if (!storesHashes.currentWaitingCnt) {
          currentWaitingCnt = '0';
          rating = '0';
        }

        const filteredRestaurant: searchRestaurantsDto = {
          storeName: restaurant.storeName,
          rating: Number(rating),
          category: restaurant.category,
          newAddress: restaurant.newAddress,
          oldAddress: restaurant.oldAddress,
          currentWaitingCnt: Number(currentWaitingCnt),
          distance: distance,
          tableForTwo: restaurant.tableForTwo,
          tableForFour: restaurant.tableForFour,
        };

        return filteredRestaurant;
      }),
    );

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
    const only20result = restaurantsResult.slice(0, 20);

    return { 근처식당목록: only20result };
  }

  //키워드로 검색부분 //sorting 추가 //전국 식당으로 //가장 가까운 순으로? --- rough
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
      // const searchByCategory = await this.searchByCategory(
      //   keyword,
      //   sort,
      //   column,
      // );
      // return searchByCategory;
    } else {
      const searchStores = await this.storesRepository.searchStores(
        keyword,
        sort,
        column,
      );
      return searchStores;
    }
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
    const pageSize = 100;
    // const from = (page - 1) * pageSize;
    const stores = await this.elasticsearchService.search<string>({
      index: 'geo4_test',
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
        const redisAll = await this.redisClient.hgetall(`store:${storeId}`);
        if (Object.keys(redisAll).length === 0) {
          const average: number = await this.getRating(storeId);
          const datas = {
            maxWaitingCnt: storesFound.maxwaitingcnt,
            currentWaitingCnt: 0,
            cycleTime: storesFound.cycletime,
            tableForTwo: storesFound.tablefortwo,
            tableForFour: storesFound.tableforfour,
            availableTableForTwo: storesFound.tablefortwo,
            availableTableForFour: storesFound.tableforfour,
            rating: average,
          };
          await this.redisClient.hset(`store:${storeId}`, datas); //perfomance test needed
          const rating = average;
          const latitude: number = storesFound.location.lat;
          const longitude: number = storesFound.location.lon;
          const start = { latitude: myLatitude, longitude: myLongitude };
          const end = { latitude: latitude, longitude: longitude };
          const distance = geolib.getDistance(start, end);
          const currentWaitingCnt = 0;
          return {
            ...storesFound,
            distance: distance + 'm',
            rating,
            currentWaitingCnt,
          };
        }
        const latitude: number = storesFound.location.lat;
        const longitude: number = storesFound.location.lon;
        const start = { latitude: myLatitude, longitude: myLongitude };
        const end = { latitude: latitude, longitude: longitude };
        const distance = geolib.getDistance(start, end);
        const currentWaitingCnt = redisAll.currentWaitingCnt;
        const rating = redisAll.rating;
        return {
          ...storesFound,
          distance: distance + 'm',
          rating,
          currentWaitingCnt,
        };
      }),
    );

    result.sort((a, b) => {
      const distanceA = parseFloat(a.distance);
      const distanceB = parseFloat(b.distance);
      return distanceA - distanceB;
    });
    return result;
  }

  //Elastic - 카테고리로 검색하기
  async searchStores2(
    keyword: string,
    sort: 'ASC' | 'DESC',
    column: string,
    myLatitude: float,
    myLongitude: float,
  ): Promise<StoresSearchDto[]> {
    const category = [
      '한식',
      '양식',
      '경양식',
      '중식',
      '중국식',
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
      console.log('카테고리');
      const query = await this.searchByCategory(
        keyword,
        sort,
        column,
        myLatitude,
        myLongitude,
      );
      // const storeData = query.map(async (items) => {
      //   const redisAll = await this.redisClient.hgetall(
      //     `store:${items.storeId}`,
      //   );
      //   if (Object.keys(redisAll).length === 0) {
      //     const rating: number = await this.getRating(items.storeId);
      //     const datas = {
      //       maxWaitingCnt: items.maxWaitingCnt,
      //       currentWaitingCnt: 0,
      //       cycleTime: items.cycleTime,
      //       tableForTwo: items.tableForTwo,
      //       tableForFour: items.tableForFour,
      //       availableTableForTwo: items.tableForTwo,
      //       availableTableForFour: items.tableForFour,
      //       rating,
      //     };
      //     await this.redisClient.hset(`store:${items.storeId}`, datas); //perfomance test needed
      //     const currentWaitingCnt = 0;
      //     const latitude: number = items.lat;
      //     const longitude: number = items.lon;
      //     const start = { latitude: myLatitude, longitude: myLongitude };
      //     const end = { latitude: latitude, longitude: longitude };
      //     const distance = geolib.getDistance(start, end);
      //     return {
      //       ...items,
      //       distance: distance + 'm',
      //       rating,
      //       currentWaitingCnt,
      //     };
      //   }
      //   const currentWaitingCnt = redisAll.currentWaitingCnt;
      //   const latitude: number = items.lat;
      //   const longitude: number = items.lon;
      //   const start = { latitude: myLatitude, longitude: myLongitude };
      //   const end = { latitude: latitude, longitude: longitude };
      //   const distance = geolib.getDistance(start, end);
      //   const rating = redisAll.rating;
      //   return {
      //     ...items,
      //     distance: distance + 'm',
      //     rating,
      //     currentWaitingCnt,
      //   };
      // });
      // const resolvedStoredDatas = await Promise.all(storeData);

      // return resolvedStoredDatas;
      return query;
    } else {
      //console.log("키워드")
      const searchStores = await this.searchByKeyword(
        keyword,
        sort,
        column,
        myLatitude,
        myLongitude,
      );
      return searchStores;
    }
  }

  async searchByCategory(
    keyword: string,
    sort: 'ASC' | 'DESC' = 'ASC',
    column: string,
    myLatitude: float,
    myLongitude: float,
  ): Promise<any[]> {
    const pageSize = 100;
    // const from = (page - 1) * pageSize;
    const stores = await this.elasticsearchService.search<any>({
      index: 'geo4_test',
      size: 100,
      //  from: from,
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
    const storesData = stores.hits.hits.map(async (hit) => {
      const storeDatas = hit._source;
      const storeId: number = storeDatas.storeid;
      const redisAll = await this.redisClient.hgetall(`store:${storeId}`);
      if (Object.keys(redisAll).length === 0) {
        const rating: number = await this.getRating(storeId);
        const datas = {
          maxWaitingCnt: storeDatas.maxwaitingcnt,
          currentWaitingCnt: 0,
          cycleTime: storeDatas.cycletime,
          tableForTwo: storeDatas.tablefortwo,
          tableForFour: storeDatas.tableforfour,
          availableTableForTwo: storeDatas.tablefortwo,
          availableTableForFour: storeDatas.tableforfour,
          rating,
        };

        await this.redisClient.hset(`store:${storeId}`, datas);
        const currentWaitingCnt = 0;
        const latitude: number = storeDatas.location.lat;
        const longitude: number = storeDatas.location.lon;
        const start = { latitude: myLatitude, longitude: myLongitude };
        const end = { latitude: latitude, longitude: longitude };
        const distance = geolib.getDistance(start, end);
        return {
          ...storeDatas,
          distance: distance + 'm',
          rating,
          currentWaitingCnt,
        };
      }
      const currentWaitingCnt = redisAll.currentWaitingCnt;
      const latitude: number = storeDatas.location.lat;
      const longitude: number = storeDatas.location.lon;
      const start = { latitude: myLatitude, longitude: myLongitude };
      const end = { latitude: latitude, longitude: longitude };
      const distance = geolib.getDistance(start, end);
      const rating = redisAll.rating;
      return {
        ...storeDatas,
        distance: distance + 'm',
        rating,
        currentWaitingCnt,
      };
    });
    const resolvedStoredDatas = await Promise.all(storesData);
    console.log(storesData.length);
    return resolvedStoredDatas;
  }
  //Elastic - 키워드로 검색하기
  async searchByKeyword(
    keyword: string,
    sort: 'ASC' | 'DESC' = 'ASC',
    column: string,
    myLatitude: float,
    myLongitude: float,
  ): Promise<any[]> {
    const pageSize = 1000;
    // const from = (page - 1) * pageSize;
    const stores = await this.elasticsearchService.search<any>({
      index: 'geo4_test',
      size: pageSize,
      //  from: from,
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
    const storesData = stores.hits.hits.map(async (hit) => {
      const storeDatas = hit._source;
      const storeId: number = storeDatas.storeid;
      const redisAll = await this.redisClient.hgetall(`store:${storeId}`);
      if (Object.keys(redisAll).length === 0) {
        const rating: number = await this.getRating(storeId);
        const datas = {
          maxWaitingCnt: storeDatas.maxwaitingcnt,
          currentWaitingCnt: 0,
          cycleTime: storeDatas.cycletime,
          tableForTwo: storeDatas.tablefortwo,
          tableForFour: storeDatas.tableforfour,
          availableTableForTwo: storeDatas.tablefortwo,
          availableTableForFour: storeDatas.tableforfour,
          rating,
        };
        await this.redisClient.hset(`store:${storeId}`, datas); //perfomance test needed
        const currentWaitingCnt = 0;
        const latitude: number = storeDatas.location.lat;
        const longitude: number = storeDatas.location.lon;
        const start = { latitude: myLatitude, longitude: myLongitude };
        const end = { latitude: latitude, longitude: longitude };
        const distance = geolib.getDistance(start, end);
        return {
          ...storeDatas,
          distance: distance + 'm',
          rating,
          currentWaitingCnt,
        };
      }
      const latitude: number = storeDatas.location.lat;
      const longitude: number = storeDatas.location.lon;
      const start = { latitude: myLatitude, longitude: myLongitude };
      const end = { latitude: latitude, longitude: longitude };
      const distance = geolib.getDistance(start, end);
      const currentWaitingCnt = redisAll.currentWaitingCnt;
      const rating = redisAll.rating;
      return {
        ...storeDatas,
        distance: distance + 'm',
        rating,
        currentWaitingCnt,
      };
    });
    const resolvedStoredDatas = await Promise.all(storesData);

    resolvedStoredDatas.sort((a, b) => {
      const distanceA = parseFloat(a.distance);
      const distanceB = parseFloat(b.distance);
      return distanceA - distanceB;
    });
    return resolvedStoredDatas;
  }

  //redis사용한 상세조회 --- 최종판
  async getOneStore(storeId: number): Promise<oneStoreDto> {
    const redisAll = await this.redisClient.hgetall(`store:${storeId}`);
    const store = await this.storesRepository.getOneStore(storeId);

    //캐싱 예외. currenWaitingCnt/Ratings APi 분리
    if (Object.keys(redisAll).length === 0) {
      const rating: number = await this.getRating(storeId);
      const storeName = store.storeName;
      const category = store.category;
      const lon = store.lon;
      const lat = store.lat;
      const data = {
        maxWaitingCnt: store.maxWaitingCnt,
        currentWaitingCnt: 0,
        cycleTime: store.cycleTime,
        tableForTwo: store.tableForTwo,
        tableForFour: store.tableForFour,
        availableTableForTwo: store.tableForTwo,
        availableTableForFour: store.tableForFour,
        rating: rating,
      };
      await this.redisClient.hset(`store:${storeId}`, data);
      delete data.availableTableForTwo;
      delete data.availableTableForFour;
      delete data.cycleTime;
      return {
        storeName,
        category,
        lat,
        lon,
        newAddress: store.newAddress,
        ...data,
      };
    }
    return {
      storeName: store.storeName,
      category: store.category,
      lon: store.lon,
      lat: store.lat,
      newAddress: store.newAddress,
      maxWaitingCnt: store.maxWaitingCnt,
      currentWaitingCnt: parseInt(redisAll.currentWaitingCnt),
      tableForFour: store.tableForFour,
      tableForTwo: store.tableForTwo,
      rating: Number(redisAll.rating),
    };
  }

  //추천식당 띄우기
  async hotPlaces(): Promise<any[]> {
    return this.storesRepository.hotPlaces();
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
        } catch (error) {
          console.error(
            `Error updating coordinates for address: ${storeId},${storeName},${newAddress}, ${oldAddress}`,
            error,
          );
        }
      }
    } catch (error) {
      console.error('Error occurred during database operation:', error);
    }
  }
}
