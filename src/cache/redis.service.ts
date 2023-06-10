// src/cache/redis.service.ts

import { Injectable, Inject } from '@nestjs/common';
//Cache는 항상 chache-manager에서 import 되어야 한다.
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as cacheManager from 'cache-manager';

@Injectable()
export class RedisCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async getCache() {
    const savedTime = await this.cacheManager.get<number>('time');
    if (savedTime) {
      return 'saved time : ' + savedTime;
    }
    const now = new Date().getTime();
    await this.cacheManager.set('time', now);
    return 'save new time : ' + now;
  }

  async set(key: string, value: any, option?: any) {
    await this.cacheManager.set(key, value, option);
  }

  async get(key: string): Promise<any> {
    return await this.cacheManager.get(key);
  }

  async reset() {
    await this.cacheManager.reset();
  }

  async del(key: string) {
    await this.cacheManager.del(key);
  }

  async injectTestData() {
    const testData = {
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
      key4: 'value4',
      key5: 'value5',
      key6: 'value6',
    };

    for (const key in testData) {
      if (testData.hasOwnProperty(key)) {
        await this.set(key, testData[key]);
      }
    }
    for (const key in testData) {
      if (testData.hasOwnProperty(key)) {
        const value = await this.get(key);
        console.log(`Key: ${key}, Value: ${value}`);
      }
    }
  }

  getHello(): string {
    return '좀 되라 씨발!!';
  }

  async getCache2(key: string) {
    try {
      const value = await this.cacheManager.get(key);
      console.log('getCache value : ', value);
      return value;
    } catch (error) {
      throw error;
    }
  }
}
