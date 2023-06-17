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
    return await this.waitingsRepository.getCurrentWaitingCnt(storeId);
  }

  @Process('postWaiting')
  async getMessageQueue(job: Job): Promise<void> {
    const { storeId, peopleCnt, user } = job.data;
    await this.waitingsRepository.postWaitings(storeId, peopleCnt, user);
    return;
  }

  @Process('postEntered')
  async postEntered(job: Job): Promise<void> {
    const { storeId, userId, peopleCnt } = job.data;
    await this.waitingsRepository.postEntered(storeId, userId, peopleCnt);
    return;
  }

  @Process('getWaitingListById')
  async getWaitingList(job: Job): Promise<Waitings[]> {
    const storeId = job.data;
    return await this.waitingsRepository.getWaitingListById(storeId);
  }

  @Process('patchToExited')
  async patchToExited(job: Job): Promise<void> {
    const { storeId, waitingId } = job.data;
    await this.waitingsRepository.patchToExited(storeId, waitingId);
    return;
  }

  @Process('patchToDelayed')
  async patchToDelayed(job: Job): Promise<void> {
    const { storeId, waitingId } = job.data;
    await this.waitingsRepository.patchToDelayed(storeId, waitingId);
    return;
  }

  @Process('patchToEntered')
  async patchToEntered(job: Job): Promise<void> {
    const { storeId, waitingId, status } = job.data;
    await this.waitingsRepository.patchToEntered(storeId, waitingId, status);
    return;
  }

  @Process('patchToCanceled')
  async patchToCanceled(job: Job): Promise<void> {
    const { storeId, waitingId } = job.data;
    await this.waitingsRepository.patchToCanceled(storeId, waitingId);
    return;
  }

  @Process('saveNoshow')
  async saveNoshow(job: Job): Promise<void> {
    const { entity } = job.data;
    await this.waitingsRepository.saveNoshow(entity);
    return;
  }

  @Process('decrementCurrentWaitingCnt')
  async decrementWaitingCnt(job: Job): Promise<void> {
    const storeId = job.data;
    await this.storesRepository.decrementCurrentWaitingCnt(storeId);
    return;
  }

  @Process('incrementCurrentWaitingCnt')
  async incrementWaitingCnt(job: Job): Promise<void> {
    const storeId = job.data;
    await this.storesRepository.incrementCurrentWaitingCnt(storeId);
    return;
  }

  @Process('decrementTables')
  async decrementTable(job: Job): Promise<void> {
    const { storeId, peopleCnt } = job.data;
    await this.tablesRepository.decrementTables(storeId, peopleCnt);
    return;
  }

  @Process('incrementTables')
  async incrementTable(job: Job): Promise<void> {
    const { storeId, peopleCnt } = job.data;
    await this.tablesRepository.incrementTables(storeId, peopleCnt);
    return;
  }

  // with Redis

  @Process('getCurrentWaitingCntInRedis')
  async getCurrentWaitingCntInRedis(job: Job): Promise<number> {
    const storeId = job.data;
    const currentWaitingCnt = await this.redisClient.hget(
      `store:${storeId}`,
      'currentWaitingCnt',
    );
    if (currentWaitingCnt) return Number(currentWaitingCnt);
    else return 0;
  }

  @Process('addStoreHashes')
  async addStoreHashes(job: Job): Promise<void> {
    const { storeId, ...data } = job.data;
    await this.redisClient.hset(`store:${storeId}`, data);
  }

  @Process('incrementCurrentWaitingCntInRedis')
  async incrementCurrentWaitingCntInRedis(job: Job): Promise<void> {
    const storeId = job.data;
    await this.redisClient.hincrby(`store:${storeId}`, 'currentWaitingCnt', 1);
  }

  @Process('decrementCurrentWaitingCntInRedis')
  async decrementCurrentWaitingCntInRedis(job: Job): Promise<void> {
    const storeId = job.data;
    await this.redisClient.hincrby(`store:${storeId}`, 'currentWaitingCnt', -1);
  }

  @Process('incrementTableInRedis')
  async incrementTableInRedis(job: Job): Promise<void> {
    const { storeId, peopleCnt } = job.data;
    let availableTable: string;
    if (peopleCnt == 1 || peopleCnt == 2) {
      availableTable = 'availableTableForTwo';
    } else {
      availableTable = 'availableTableForFour';
    }
    await this.redisClient.hincrby(`store:${storeId}`, availableTable, 1);
  }

  @Process('decrementTableInRedis')
  async decrementTableInRedis(job: Job): Promise<void> {
    const { storeId, peopleCnt } = job.data;
    let availableTable: string;
    if (peopleCnt == 1 || peopleCnt == 2) {
      availableTable = 'availableTableForTwo';
    } else {
      availableTable = 'availableTableForFour';
    }
    await this.redisClient.hincrby(`store:${storeId}`, availableTable, -1);
  }

  @Process('getStoreHashesFromRedis')
  async getStoreHashesFromRedis(job: Job): Promise<any> {
    const storeId = job.data;
    return await this.redisClient.hgetall(`store:${storeId}`);
  }

  // one add at one api

  @Process('postWaitingWithRedis')
  async postWaitingWithRedis(job: Job): Promise<void> {
    const { storeId, peopleCnt, user } = job.data;
    await this.waitingsRepository.postWaitings(storeId, peopleCnt, user);
    await this.redisClient.hincrby(`store:${storeId}`, 'currentWaitingCnt', 1);
    return;
  }

  @Process('addStoreHashAndPostEntered')
  async addStoreHashAndPostEntered(job: Job): Promise<void> {
    const { storeId, userId, peopleCnt, ...data } = job.data;
    await this.redisClient.hset(`store:${storeId}`, data);
    await this.waitingsRepository.postEntered(storeId, userId, peopleCnt);
  }

  @Process('exitedAndIncrementTable')
  async patchToExitedAndIncrementTable(job: Job): Promise<void> {
    const { storeId, peopleCnt, waitingId } = job.data;
    await this.waitingsRepository.patchToExited(storeId, waitingId);
    let availableTable: string;
    if (peopleCnt == 1 || peopleCnt == 2) {
      availableTable = 'availableTableForTwo';
    } else {
      availableTable = 'availableTableForFour';
    }
    await this.redisClient.hincrby(`store:${storeId}`, availableTable, 1);
    return;
  }

  @Process('enteredAndDecrementCnts')
  async enteredAndDecrementCnts(job: Job): Promise<void> {
    const { storeId, waitingId, status, peopleCnt } = job.data;
    await this.waitingsRepository.patchToEntered(storeId, waitingId, status);
    let availableTable: string;
    if (peopleCnt == 1 || peopleCnt == 2) {
      availableTable = 'availableTableForTwo';
    } else {
      availableTable = 'availableTableForFour';
    }
    await this.redisClient.hincrby(`store:${storeId}`, availableTable, -1);
    await this.redisClient.hincrby(`store:${storeId}`, 'currentWaitingCnt', -1);
    return;
  }

  @Process('canceledAndDecrementWaitingCnt')
  async canceledAndDecrementWaitingCnt(job: Job): Promise<void> {
    const { storeId, waitingId } = job.data;
    await this.waitingsRepository.patchToCanceled(storeId, waitingId);
    await this.redisClient.hincrby(`store:${storeId}`, 'currentWaitingCnt', -1);
    return;
  }

  @Process('saveNoshowAndDecrementWaitingCnt')
  async saveNoshowAndDecrementWaitingCnt(job: Job): Promise<void> {
    const { entity } = job.data;
    await this.waitingsRepository.saveNoshow(entity);
    const storeId = entity.StoreId;
    await this.redisClient.hincrby(`store:${storeId}`, 'currentWaitingCnt', -1);
    return;
  }
}
