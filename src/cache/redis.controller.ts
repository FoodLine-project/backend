// example.controller.ts

import { Controller, Get, Param, Post, Body, Patch } from '@nestjs/common';
import { RedisCacheService } from './../cache/redis.service';
import { Public } from 'src/auth/common/decorators';
import { Cron } from '@nestjs/schedule';

@Controller('example')
export class RedisController {
  constructor(private readonly redisCacheService: RedisCacheService) {}

  @Public()
  @Get('inject-test-data')
  async injectTestData(): Promise<string> {
    await this.redisCacheService.injectTestData();
    return 'Test data injected successfully.';
  }

  @Public()
  @Get('get-key')
  async getData(): Promise<any> {
    const key = 'a';

    const value = await this.redisCacheService.get(key);
    const data = { [key]: value };
    console.log(data);
    return data;
  }

  @Public()
  @Get('get-data')
  async getAllData(): Promise<any> {
    const keys = ['key1', 'key2', 'key3', 'key4', 'key5', 'key6'];
    const data = {};

    for (const key of keys) {
      const value = await this.redisCacheService.get(key);
      data[key] = value;
    }
    console.log(data);
    return data;
  }

  @Public()
  @Get('cache')
  getCache() {
    return this.redisCacheService.getCache();
  }

  @Public()
  @Get()
  async getHello() {
    return this.redisCacheService.getHello();
  }

  @Public()
  @Post('set')
  async setValue(@Body() data: { key: string; value: any; option?: any }) {
    const { key, value, option } = data;
    await this.redisCacheService.set(key, value, option);
    return 'Value set successfully';
  }

  @Public()
  @Get('/cache/:key')
  async getCache2(@Param('key') key: string) {
    try {
      return await this.redisCacheService.getCache2(key);
    } catch (error) {
      throw error;
    }
  }
}
