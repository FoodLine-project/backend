import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Stores } from './stores.entity';
import { CreateStoresDto } from './dto/create-stores.dto';
import { StoresSearchDto } from './dto/search-stores.dto';
import { StoresRepository } from './stores.repository';
import axios from 'axios';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(StoresRepository)
    private storesRepository: StoresRepository,
  ) {}

  private readonly API_KEY = 'e84edcba09907dc19727de566a994a88';

  async searchPlaces(
    query: string,
    userLocation: { latitude: number; longitude: number },
  ): Promise<any> {
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${query}&y=${userLocation.latitude}&x=${userLocation.longitude}&radius=3000`;
    const response = await axios.get(url, {
      headers: {
        Authorization: 'KakaoAK ' + this.API_KEY,
      },
    });

    const filteredResults = response.data.documents
      .filter((place: any) => place.category_group_name === '음식점')
      .map((place: any) => {
        const {
          id,
          category_group_name,
          place_name,
          phone,
          address_name,
          road_address_name,
          distance,
          place_url,
          x,
          y,
        } = place;
        return {
          storeId: id,
          category_name: category_group_name,
          place_name,
          phone,
          address_name,
          road_address_name,
          distance: `${distance}m`,
          place_url,
          x,
          y,
        };
      })
      .sort((a: any, b: any) => {
        const distanceA = parseInt(a.distance.replace('m', ''));
        const distanceB = parseInt(b.distance.replace('m', ''));
        return distanceA - distanceB;
      });

    return filteredResults;
  }

  async searchStores(keyword: string): Promise<StoresSearchDto[]> {
    const searchStores = await this.storesRepository.searchStores(keyword);
    return searchStores;
  }

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
}
