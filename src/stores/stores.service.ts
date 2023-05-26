import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class KakaoMapService {
  private readonly API_KEY = 'e84edcba09907dc19727de566a994a88';

  async searchPlaces(
    query: string,
    userLocation: { latitude: number; longitude: number },
  ): Promise<any> {
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${query}&y=${userLocation.latitude}&x=${userLocation.longitude}&radius=3000`;
    console.log(url);
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
}
