import { Redis } from 'ioredis';
import { StoresRepository } from '../stores/stores.repository';
import { TablesRepository } from '../tables/tables.repository';
import { WaitingsRepository } from './waitings.repository';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Waitings } from './waitings.entity';
import { EventEmitter } from 'events';
import { InjectRedis } from '@liaoliaots/nestjs-redis';

EventEmitter.defaultMaxListeners = 100;
@Processor('waitingQueue')
export class WaitingConsumer {
  constructor(
    @InjectRedis('waitingManager') private readonly redisClient: Redis,
    // @InjectRedis('local') private readonly redisClient: Redis,
    private readonly waitingsRepository: WaitingsRepository,
    private readonly tablesRepository: TablesRepository,
    private readonly storesRepository: StoresRepository,
  ) {}

  @Process('getCurrentWaitingCnt')
  async getCurrentWaitingCnt(job: Job): Promise<number> {
    const storeId = job.data;
    try {
      return await this.waitingsRepository.getCurrentWaitingCnt(storeId);
    } catch (err) {
      throw new Error('Redis 연결에 실패했습니다');
    }
  }

  @Process('postWaiting')
  async getMessageQueue(job: Job): Promise<void> {
    const { storeId, peopleCnt, user } = job.data;
    try {
      await this.waitingsRepository.postWaitings(storeId, peopleCnt, user);
      return;
    } catch (err) {
      throw new Error('Redis 연결에 실패했습니다');
    }
  }

  @Process('postEntered')
  async postEntered(job: Job): Promise<void> {
    const { storeId, userId, peopleCnt } = job.data;
    try {
      await this.waitingsRepository.postEntered(storeId, userId, peopleCnt);
      return;
    } catch (err) {
      throw new Error('Redis 연결에 실패했습니다');
    }
  }

  @Process('getWaitingListById')
  async getWaitingList(job: Job): Promise<Waitings[]> {
    const storeId = job.data;
    try {
      return await this.waitingsRepository.getWaitingListById(storeId);
    } catch (err) {
      throw new Error('Redis 연결에 실패했습니다');
    }
  }

  @Process('patchToExited')
  async patchToExited(job: Job): Promise<void> {
    const { storeId, waitingId } = job.data;
    try {
      await this.waitingsRepository.patchToExited(storeId, waitingId);
      return;
    } catch (err) {
      throw new Error('Redis 연결에 실패했습니다');
    }
  }

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

  @Process('patchToEntered')
  async patchToEntered(job: Job): Promise<void> {
    const { storeId, waitingId, status } = job.data;
    try {
      await this.waitingsRepository.patchToEntered(storeId, waitingId, status);
      return;
    } catch (err) {
      throw new Error('Redis 연결에 실패했습니다');
    }
  }

  @Process('patchToCanceled')
  async patchToCanceled(job: Job): Promise<void> {
    const { storeId, waitingId } = job.data;
    try {
      await this.waitingsRepository.patchToCanceled(storeId, waitingId);
      return;
    } catch (err) {
      throw new Error('Redis 연결에 실패했습니다');
    }
  }

  @Process('saveNoshow')
  async saveNoshow(job: Job): Promise<void> {
    const { entity } = job.data;
    try {
      await this.waitingsRepository.saveNoshow(entity);
      return;
    } catch (err) {
      throw new Error('Redis 연결에 실패했습니다');
    }
  }

  @Process('decrementTables')
  async decrementTable(job: Job): Promise<void> {
    const { storeId, peopleCnt } = job.data;
    try {
      await this.tablesRepository.decrementTables(storeId, peopleCnt);
      return;
    } catch (err) {
      throw new Error('Redis 연결에 실패했습니다');
    }
  }

  @Process('incrementTables')
  async incrementTable(job: Job): Promise<void> {
    const { storeId, peopleCnt } = job.data;
    try {
      await this.tablesRepository.incrementTables(storeId, peopleCnt);
      return;
    } catch (err) {
      throw new Error('Redis 연결에 실패했습니다');
    }
  }

  // with Redis

  @Process('getCurrentWaitingCntInRedis')
  async getCurrentWaitingCntInRedis(job: Job): Promise<number> {
    const storeId = job.data;
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

  @Process('addStoreHashes')
  async addStoreHashes(job: Job): Promise<void> {
    const { storeId, ...data } = job.data;
    try {
      await this.redisClient.hset(`store:${storeId}`, data);
    } catch (err) {
      throw new Error('Redis 연결에 실패했습니다');
    }
  }

  @Process('incrementCurrentWaitingCntInRedis')
  async incrementCurrentWaitingCntInRedis(job: Job): Promise<void> {
    const storeId = job.data;
    try {
      await this.redisClient.hincrby(
        `store:${storeId}`,
        'currentWaitingCnt',
        1,
      );
    } catch (err) {
      throw new Error('Redis 연결에 실패했습니다');
    }
  }

  @Process('decrementCurrentWaitingCntInRedis')
  async decrementCurrentWaitingCntInRedis(job: Job): Promise<void> {
    const storeId = job.data;
    try {
      await this.redisClient.hincrby(
        `store:${storeId}`,
        'currentWaitingCnt',
        -1,
      );
    } catch (err) {
      throw new Error('Redis 연결에 실패했습니다');
    }
  }

  @Process('incrementTableInRedis')
  async incrementTableInRedis(job: Job): Promise<void> {
    const { storeId, peopleCnt } = job.data;
    try {
      let availableTable: string;
      if (peopleCnt == 1 || peopleCnt == 2) {
        availableTable = 'availableTableForTwo';
      } else {
        availableTable = 'availableTableForFour';
      }
      await this.redisClient.hincrby(`store:${storeId}`, availableTable, 1);
    } catch (err) {
      throw new Error('Redis 연결에 실패했습니다');
    }
  }

  @Process('decrementTableInRedis')
  async decrementTableInRedis(job: Job): Promise<void> {
    const { storeId, peopleCnt } = job.data;
    try {
      let availableTable: string;
      if (peopleCnt == 1 || peopleCnt == 2) {
        availableTable = 'availableTableForTwo';
      } else {
        availableTable = 'availableTableForFour';
      }
      await this.redisClient.hincrby(`store:${storeId}`, availableTable, -1);
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
