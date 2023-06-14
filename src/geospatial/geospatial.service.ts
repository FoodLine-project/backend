import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';

@Injectable()
export class GeospatialService {
  constructor(@InjectRedis() private readonly client: Redis) {}

  async addStore(
    latitude: number,
    longitude: number,
    name: string,
  ): Promise<number> {
    return await this.client.geoadd('stores', longitude, latitude, name);
  }

  async getStoresWithinRadius(
    longitude: number,
    latitude: number,
    radius: number,
    sortBy?: string,
  ): Promise<any[]> {
    if (sortBy === 'distance') {
      return await this.client.georadius(
        'stores',
        longitude,
        latitude,
        radius,
        'km',
        'withdist',
        'asc',
      );
    }
    return await this.client.georadius(
      'stores',
      longitude,
      latitude,
      radius,
      'km',
      'withdist',
    );
  }

  async getStoresWithinBox(
    latitude: number,
    longitude: number,
    width: number,
    height: number,
    sortBy?: string,
  ): Promise<any[]> {
    console.log(latitude, longitude, width, height);
    if (sortBy === 'distance') {
      return await this.client.geosearch(
        'stores',
        'FROMLONLAT',
        latitude,
        longitude,
        'BYBOX',
        width,
        height,
        'km',
        'withdist',
        'asc',
      );
    }
    return await this.client.geosearch(
      'stores',
      'FROMLONLAT',
      latitude,
      longitude,
      'BYBOX',
      width,
      height,
      'km',
      'withdist',
    );
  }

  async getStorePos(
    storeId: string,
  ): Promise<[longitude: string, latitude: string][]> {
    const store = await this.client.geopos('stores', storeId);
    return store;
  }
}
