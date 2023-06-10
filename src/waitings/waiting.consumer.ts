import { StoresRepository } from '../stores/stores.repository';
import { TablesRepository } from '../tables/tables.repository';
import { WaitingsRepository } from './waitings.repository';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Waitings } from './waitings.entity';
import { EventEmitter } from 'events';

EventEmitter.defaultMaxListeners = 100;
@Processor('waitingQueue')
export class WaitingConsumer {
  constructor(
    private readonly waitingsRepository: WaitingsRepository,
    private readonly tablesRepository: TablesRepository,
    private readonly storesRepository: StoresRepository,
  ) {}

  @Process('getCurrentWaitingCnt')
  async getCurrentWaitingCnt(job: Job): Promise<number> {
    const storeId = job.data;
    console.log(`${job.id}의 작업을 수행하였습니다`);
    return await this.waitingsRepository.getCurrentWaitingCnt(storeId);
  }

  @Process('postWaiting')
  async getMessageQueue(job: Job): Promise<void> {
    const { storeId, peopleCnt, user } = job.data;
    console.log(`${job.id}의 작업을 수행하였습니다`);
    await this.waitingsRepository.postWaitings(storeId, peopleCnt, user);
    return;
  }

  @Process('postEntered')
  async postEntered(job: Job): Promise<void> {
    const { storeId, userId, peopleCnt } = job.data;
    console.log(`${job.id}의 작업을 수행하였습니다`);
    await this.waitingsRepository.postEntered(storeId, userId, peopleCnt);
    return;
  }

  @Process('getWaitingListById')
  async getWaitingList(job: Job): Promise<Waitings[]> {
    const storeId = job.data;
    console.log(`${job.id}의 작업을 수행하였습니다`);
    return await this.waitingsRepository.getWaitingListById(storeId);
  }

  @Process('patchToExited')
  async patchToExited(job: Job): Promise<void> {
    const { storeId, waitingId } = job.data;
    console.log(`${job.id}의 작업을 수행하였습니다`);
    await this.waitingsRepository.patchToExited(storeId, waitingId);
    return;
  }

  @Process('patchToDelayed')
  async patchToDelayed(job: Job): Promise<void> {
    const { storeId, waitingId } = job.data;
    console.log(`${job.id}의 작업을 수행하였습니다`);
    await this.waitingsRepository.patchToDelayed(storeId, waitingId);
    return;
  }

  @Process('patchToEntered')
  async patchToEntered(job: Job): Promise<void> {
    const { storeId, waitingId, status } = job.data;
    console.log(`${job.id}의 작업을 수행하였습니다`);
    await this.waitingsRepository.patchToEntered(storeId, waitingId, status);
    return;
  }

  @Process('patchToCanceled')
  async patchToCanceled(job: Job): Promise<void> {
    const { storeId, waitingId } = job.data;
    console.log(`${job.id}의 작업을 수행하였습니다`);
    await this.waitingsRepository.patchToCanceled(storeId, waitingId);
    return;
  }

  @Process('saveNoshow')
  async saveNoshow(job: Job): Promise<void> {
    const { entity } = job.data;
    console.log(`${job.id}의 작업을 수행하였습니다`);
    await this.waitingsRepository.saveNoshow(entity);
    return;
  }

  @Process('decrementCurrentWaitingCnt')
  async decrementWaitingCnt(job: Job): Promise<void> {
    const storeId = job.data;
    console.log(`${job.id}의 작업을 수행하였습니다`);
    await this.storesRepository.decrementCurrentWaitingCnt(storeId);
    return;
  }

  @Process('incrementCurrentWaitingCnt')
  async incrementWaitingCnt(job: Job): Promise<void> {
    const storeId = job.data;
    console.log(`${job.id}의 작업을 수행하였습니다`);
    await this.storesRepository.incrementCurrentWaitingCnt(storeId);
    return;
  }

  @Process('incrementTables')
  async incrementTable(job: Job): Promise<void> {
    const { storeId, peopleCnt } = job.data;
    console.log(`${job.id}의 작업을 수행하였습니다`);
    await this.tablesRepository.incrementTables(storeId, peopleCnt);
    return;
  }

  @Process('decrementTables')
  async decrementTable(job: Job): Promise<void> {
    const { storeId, peopleCnt } = job.data;
    console.log(`${job.id}의 작업을 수행하였습니다`);
    await this.tablesRepository.decrementTables(storeId, peopleCnt);
    return;
  }

  @Process('incrementTables')
  async incrementTable(job: Job): Promise<void> {
    const { storeId, peopleCnt } = job.data;
    console.log(`${job.id}의 작업을 수행하였습니다`);
    await this.tablesRepository.incrementTables(storeId, peopleCnt);
    return;
  }
}
