import { ReviewsRepository } from './../reviews/reviews.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Stores } from './stores.entity';
import { CreateStoresDto } from './dto/create-stores.dto';
import { StoresSearchDto } from './dto/search-stores.dto';
import { StoresRepository } from './stores.repository';
// import axios from 'axios';
import { createReadStream } from 'fs';
import * as csvParser from 'csv-parser';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(StoresRepository)
    private storesRepository: StoresRepository,
    private reviewsRepository: ReviewsRepository,
  ) {}

  // 좌표간의 거리 계산, 단순 위도 및 경도 차이의 절대값으로 반환
  calculateDistance(
    coord1: { latitude: number; longitude: number },
    coord2: { latitude: number; longitude: number },
  ): number {
    const latDiff = Math.abs(coord1.latitude - coord2.latitude);
    const lngDiff = Math.abs(coord1.longitude - coord2.longitude);
    //대략적인 거리를 계산하기 위해 위도와 경도의 차이를 합산해서 m로 반환
    //소수점 아래는 버리기 위해서 Math.floor사용
    const approximateDistance = Math.floor(latDiff * 111000 + lngDiff * 111000);
    return approximateDistance;
  }

  //사용자 위치 기반 반경 1km내의 식당 조회
  async findResWithinRadius(
    southWestLatitude: number,
    southWestLongitude: number,
    northEastLatitude: number,
    northEastLongitude: number,
  ): Promise<{ 근처식당목록: Stores[] }> {
    //일단 모든 data를 조회한다
    const restaurants = await this.storesRepository.findAll();
    const restaurantsWithinRadius = restaurants.filter((restaurant) => {
      const withinLatitudeRange =
        Number(restaurant.La) >= southWestLatitude &&
        Number(restaurant.La) <= northEastLatitude;
      const withinLongitudeRange =
        Number(restaurant.Ma) >= southWestLongitude &&
        Number(restaurant.Ma) <= northEastLongitude;
      return withinLatitudeRange && withinLongitudeRange;
    });

    // 가까운 순으로 sort
    const userLocation = {
      latitude: southWestLatitude,
      longitude: southWestLongitude,
    };
    restaurantsWithinRadius.forEach((restaurant) => {
      const distance = this.calculateDistance(userLocation, {
        latitude: restaurant.La,
        longitude: restaurant.Ma,
      });
      restaurant.distance = distance;
      // restaurant.distance = distance; // 거리를 추가하여 저장
    });

    // 거리순으로 정렬
    restaurantsWithinRadius.sort(
      (a, b) => (a.distance || 0) - (b.distance || 0),
    );

    console.log(restaurantsWithinRadius);
    return { 근처식당목록: restaurantsWithinRadius };
  }

  //이름순으로 정렬하는 api
  async findResWithName(
    southWestLatitude: number,
    southWestLongitude: number,
    northEastLatitude: number,
    northEastLongitude: number,
  ): Promise<{ 근처식당목록: Stores[] }> {
    //일단 모든 data를 조회한다
    const restaurants = await this.storesRepository.findAll();
    const restaurantsWithinRadiusAndName = restaurants.filter((restaurant) => {
      const withinLatitudeRange =
        Number(restaurant.La) >= southWestLatitude &&
        Number(restaurant.La) <= northEastLatitude;
      const withinLongitudeRange =
        Number(restaurant.Ma) >= southWestLongitude &&
        Number(restaurant.Ma) <= northEastLongitude;
      return withinLatitudeRange && withinLongitudeRange;
    });

    restaurantsWithinRadiusAndName.sort((a, b) => {
      const nameA = a.storeName.toUpperCase();
      const nameB = b.storeName.toUpperCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });

    console.log(restaurantsWithinRadiusAndName);
    return { 근처식당목록: restaurantsWithinRadiusAndName };
  }

  //현재 웨이팅수 적은기준으로 정렬하는 api
  async findResWithWaitingCnt(
    southWestLatitude: number,
    southWestLongitude: number,
    northEastLatitude: number,
    northEastLongitude: number,
  ): Promise<{ 근처식당목록: Stores[] }> {
    //일단 모든 data를 조회한다
    const restaurants = await this.storesRepository.findAll();
    const restaurantsWithWaitingCnt = restaurants.filter((restaurant) => {
      const withinLatitudeRange =
        Number(restaurant.La) >= southWestLatitude &&
        Number(restaurant.La) <= northEastLatitude;
      const withinLongitudeRange =
        Number(restaurant.Ma) >= southWestLongitude &&
        Number(restaurant.Ma) <= northEastLongitude;
      return withinLatitudeRange && withinLongitudeRange;
    });

    restaurants.sort((a, b) => a.currentWaitingCnt - b.currentWaitingCnt);

    console.log(restaurantsWithWaitingCnt);
    return { 근처식당목록: restaurantsWithWaitingCnt };
  }

  //현재 웨이팅수 많은기준으로 정렬하는 api
  async findResWithWaitingCnt2(
    southWestLatitude: number,
    southWestLongitude: number,
    northEastLatitude: number,
    northEastLongitude: number,
  ): Promise<{ 근처식당목록: Stores[] }> {
    //일단 모든 data를 조회한다
    const restaurants = await this.storesRepository.findAll();
    const restaurantsWithWaitingCnt = restaurants.filter((restaurant) => {
      const withinLatitudeRange =
        Number(restaurant.La) >= southWestLatitude &&
        Number(restaurant.La) <= northEastLatitude;
      const withinLongitudeRange =
        Number(restaurant.Ma) >= southWestLongitude &&
        Number(restaurant.Ma) <= northEastLongitude;
      return withinLatitudeRange && withinLongitudeRange;
    });

    restaurants.sort((a, b) => b.currentWaitingCnt - a.currentWaitingCnt);

    console.log(restaurantsWithWaitingCnt);
    return { 근처식당목록: restaurantsWithWaitingCnt };
  }

  //rating 높은기준으로 정렬하는 api
  async findResWithRating(
    southWestLatitude: number,
    southWestLongitude: number,
    northEastLatitude: number,
    northEastLongitude: number,
  ): Promise<{ 근처식당목록: Stores[] }> {
    //일단 모든 data를 조회한다
    const restaurants = await this.storesRepository.findAll();
    const restaurantsWithRating = restaurants.filter((restaurant) => {
      const withinLatitudeRange =
        Number(restaurant.La) >= southWestLatitude &&
        Number(restaurant.La) <= northEastLatitude;
      const withinLongitudeRange =
        Number(restaurant.Ma) >= southWestLongitude &&
        Number(restaurant.Ma) <= northEastLongitude;
      return withinLatitudeRange && withinLongitudeRange;
    });

    restaurants.sort((a, b) => b.rating - a.rating);

    console.log(restaurantsWithRating);
    return { 근처식당목록: restaurantsWithRating };
  }

  //sorting //쿼리 searching 따로

  //키워드로 검색부분 //sorting 추가 //전국 식당으로 //가장 가까운 순으로?
  async searchStores(keyword: string): Promise<StoresSearchDto[]> {
    const searchStores = await this.storesRepository.searchStores(keyword);
    return searchStores;
  }

  //상세조회 + 댓글
  async getOneStore(storeId: number): Promise<Stores> {
    const getOneStore = await this.storesRepository.findOne({
      where: { storeId: storeId },
      relations: ['reviews'],
    });
    console.log(getOneStore);
    return getOneStore;
  }

  //임시
  async createStore(createUserDto: CreateStoresDto): Promise<Stores> {
    const {
      storeName,
      category,
      description,
      maxWaitingCnt,
      currentWaitingCnt,
      Ma,
      La,
      tableForTwo,
      tableForFour,
    } = createUserDto;
    const store = this.storesRepository.create({
      storeName,
      category,
      description,
      maxWaitingCnt,
      currentWaitingCnt,
      Ma,
      La,
      tableForTwo,
      tableForFour,
    });
    await this.storesRepository.save(store);
    return store;
  }

  //CSV 부분
  async processCSVFile(inputFile: string): Promise<void> {
    const batchSize = 100;

    return new Promise<void>((resolve, reject) => {
      let currentBatch: any[] = [];
      createReadStream(inputFile, { encoding: 'utf-8' })
        .pipe(csvParser())
        .on('error', (error) => {
          console.error('Error reading CSV file:', error);
          reject(error);
        })
        .on('data', async (row: any) => {
          if (row['상세영업상태코드'] === '01') {
            currentBatch.push(row);

            if (currentBatch.length === batchSize) {
              await this.storesRepository.processCSVFile(currentBatch);
              currentBatch = [];
            }
          }
        })
        .on('end', async () => {
          if (currentBatch.length > 0) {
            await this.storesRepository.processCSVFile(currentBatch);
          }
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
        const { address, oldAddress, storeId } = store;

        try {
          let coordinates = await this.storesRepository.getCoordinate(address);

          if (!coordinates) {
            coordinates = await this.storesRepository.getCoordinate(oldAddress);
          }
          if (!coordinates) continue;

          const La = coordinates[0];
          const Ma = coordinates[1];

          await this.storesRepository.updateCoord(La, Ma, storeId);

          console.log(
            `Updated coordinates for address: ${address}`,
            La,
            Ma,
            storeId,
          );
        } catch (error) {
          console.error(
            `Error updating coordinates for address: ${address} and ${oldAddress}`,
            error,
          );
        }
      }
    } catch (error) {
      console.error('Error occurred during database operation:', error);
    }
  }

  async updateRating(storeId: number): Promise<void> {
    const averageRating = await this.reviewsRepository.getAverageRating(
      storeId,
    );
    return this.storesRepository.updateRating(storeId, averageRating);
  }
}

// private readonly API_KEY = 'e84edcba09907dc19727de566a994a88';

// async searchPlaces(
//   query: string,
//   userLocation: { latitude: number; longitude: number },
// ): Promise<any> {
//   const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${query}&y=${userLocation.latitude}&x=${userLocation.longitude}&radius=3000`;
//   const response = await axios.get(url, {
//     headers: {
//       Authorization: 'KakaoAK ' + this.API_KEY,
//     },
//   });

//   const filteredResults = response.data.documents
//     .filter((place: any) => place.category_group_name === '음식점')
//     .map((place: any) => {
//       const {
//         id,
//         category_group_name,
//         place_name,
//         phone,
//         address_name,
//         road_address_name,
//         distance,
//         place_url,
//         x,
//         y,
//       } = place;
//       return {
//         storeId: id,
//         category_name: category_group_name,
//         place_name,
//         phone,
//         address_name,
//         road_address_name,
//         distance: `${distance}m`,
//         place_url,
//         x,
//         y,
//       };
//     })
//     .sort((a: any, b: any) => {
//       const distanceA = parseInt(a.distance.replace('m', ''));
//       const distanceB = parseInt(b.distance.replace('m', ''));
//       return distanceA - distanceB;
//     });

//   return filteredResults;
// }
