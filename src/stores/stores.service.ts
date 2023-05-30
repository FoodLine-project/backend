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
  ) {}

  //사용자 위치 기반 반경 1km내의 식당 조회
  async findRestaurantsWithinRadius(
    southWestLatitude: number,
    southWestLongitude: number,
    northEastLatitude: number,
    northEastLongitude: number,
  ): Promise<{ 근처식당목록: Stores[] }> {
    const restaurants = await this.storesRepository.findAll();
    const restaurantsWithinRadius = restaurants.filter((restaurant) => {
      const withinLatitudeRange =
        restaurant.La >= southWestLatitude &&
        restaurant.La <= northEastLatitude;
      const withinLongitudeRange =
        restaurant.Ma >= southWestLongitude &&
        restaurant.Ma <= northEastLongitude;
      return withinLatitudeRange && withinLongitudeRange;
    });
    console.log(restaurantsWithinRadius);
    return { 근처식당목록: restaurantsWithinRadius };
  }

  //키워드로 검색부분
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
        const { address, storeId } = store;

        try {
          const coordinates = await this.storesRepository.getCoordinate(
            address,
          );

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
            `Error updating coordinates for address: ${address}`,
            error,
          );
        }
      }
    } catch (error) {
      console.error('Error occurred during database operation:', error);
    }
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
