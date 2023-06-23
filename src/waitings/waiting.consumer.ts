import { Redis } from 'ioredis';
import { WaitingsRepository } from './waitings.repository';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { EventEmitter } from 'events';
import { InjectRedis } from '@liaoliaots/nestjs-redis';

EventEmitter.defaultMaxListeners = 100;
@Processor('waitingQueue')
export class WaitingConsumer {
  constructor(
    @InjectRedis('waitingManager') private readonly redisClient: Redis,
    private readonly waitingsRepository: WaitingsRepository,
  ) {}

  @Process('patchToDelayed')
  async patchToDelayed(job: Job): Promise<void> {
    const { storeId, waitingId } = job.data;
    try {
      await this.waitingsRepository.patchToDelayed(storeId, waitingId);
      return;
    } catch (err) {
      throw new Error('Redis 연결에 실패했습니다');
    }
  }

  // with Redis
  @Process('getCurrentWaitingCntInRedis')
  async getCurrentWaitingCntInRedis(job: Job): Promise<number> {
    const storeId = job.data;
    console.log(`${job.id}번의 작업을 수행하였습니다`);
    try {
      const currentWaitingCnt = await this.redisClient.hget(
        `store:${storeId}`,
        'currentWaitingCnt',
      );
      if (currentWaitingCnt) return Number(currentWaitingCnt);
      else return 0;
    } catch (err) {
      throw new Error('Redis 연결에 실패했습니다');
    }
  }
  @Process('getStoreHashesFromRedis')
  async getStoreHashesFromRedis(job: Job): Promise<any> {
    const storeId = job.data;
    try {
      return await this.redisClient.hgetall(`store:${storeId}`);
    } catch (err) {
      throw new Error('Redis 연결에 실패했습니다');
    }
  }

  // one add at one api

  @Process('postWaitingWithRedis')
  async postWaitingWithRedis(job: Job): Promise<void> {
    const { storeId, peopleCnt, user } = job.data;
    try {
      await this.waitingsRepository.postWaitings(storeId, peopleCnt, user);
      await this.redisClient.hincrby(
        `store:${storeId}`,
        'currentWaitingCnt',
        1,
      );
      return;
    } catch (err) {
      throw new Error('Redis 연결에 실패했습니다');
    }
  }

  @Process('addStoreHashAndPostEntered')
  async addStoreHashAndPostEntered(job: Job): Promise<void> {
    const { storeId, userId, peopleCnt, ...data } = job.data;
    try {
      await this.redisClient.hset(`store:${storeId}`, data);
      await this.waitingsRepository.postEntered(storeId, userId, peopleCnt);
    } catch (err) {
      throw new Error('Redis 연결에 실패했습니다');
    }
  }

  @Process('exitedAndIncrementTable')
  async patchToExitedAndIncrementTable(job: Job): Promise<void> {
    const { storeId, peopleCnt, waitingId } = job.data;
    try {
      await this.waitingsRepository.patchToExited(storeId, waitingId);
      let availableTable: string;
      if (peopleCnt == 1 || peopleCnt == 2) {
        availableTable = 'availableTableForTwo';
      } else {
        availableTable = 'availableTableForFour';
      }
      await this.redisClient.hincrby(`store:${storeId}`, availableTable, 1);
      return;
    } catch (err) {
      throw new Error('Redis 연결에 실패했습니다');
    }
  }

  @Process('enteredAndDecrementCnts')
  async enteredAndDecrementCnts(job: Job): Promise<void> {
    const { storeId, waitingId, status, peopleCnt } = job.data;
    try {
      await this.waitingsRepository.patchToEntered(storeId, waitingId, status);
      let availableTable: string;
      if (peopleCnt == 1 || peopleCnt == 2) {
        availableTable = 'availableTableForTwo';
      } else {
        availableTable = 'availableTableForFour';
      }
      await this.redisClient.hincrby(`store:${storeId}`, availableTable, -1);
      await this.redisClient.hincrby(
        `store:${storeId}`,
        'currentWaitingCnt',
        -1,
      );
      return;
    } catch (err) {
      throw new Error('Redis 연결에 실패했습니다');
    }
  }

  @Process('canceledAndDecrementWaitingCnt')
  async canceledAndDecrementWaitingCnt(job: Job): Promise<void> {
    const { storeId, waitingId } = job.data;
    try {
      await this.waitingsRepository.patchToCanceled(storeId, waitingId);
      await this.redisClient.hincrby(
        `store:${storeId}`,
        'currentWaitingCnt',
        -1,
      );
      return;
    } catch (err) {
      throw new Error('Redis 연결에 실패했습니다');
    }
  }

  @Process('saveNoshowAndDecrementWaitingCnt')
  async saveNoshowAndDecrementWaitingCnt(job: Job): Promise<void> {
    const { entity } = job.data;
    try {
      await this.waitingsRepository.saveNoshow(entity);
      const storeId = entity.StoreId;
      await this.redisClient.hincrby(
        `store:${storeId}`,
        'currentWaitingCnt',
        -1,
      );
      return;
    } catch (err) {
      throw new Error('Redis 연결에 실패했습니다');
    }
  }
}
