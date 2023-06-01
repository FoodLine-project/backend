import { WaitingsRepository } from './waitings.repository';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('waitingQueue')
export class WaitingConsumer {
  constructor(private readonly waitingsRepository: WaitingsRepository) {}

  @Process('postWaiting')
  async getMessageQueue(job: Job) {
    const { storeId, peopleCnt, user } = job.data;
    console.log(`${job.id}의 작업을 수행하였습니다`);
    await this.waitingsRepository.postWaitings(storeId, peopleCnt, user);
  }

  @Process('getCurrentWaitingCnt')
  async getCurrentWaitingCnt(job: Job): Promise<number> {
    const { storeId } = job.data;
    console.log(`${job.id}의 작업을 수행하였습니다`);
    return await this.waitingsRepository.getCurrentWaitingCnt(storeId);
  }
}
