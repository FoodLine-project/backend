import { Users } from 'src/auth/users.entity';
import { WaitingStatus } from './waitingStatus.enum';
import { Waitings } from './waitings.entity';
import { WaitingsRepository } from './waitings.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WaitingsService {
  constructor(private waitingsRepository: WaitingsRepository) {}

  getCurrentWaitingsCnt(storeId: number): Promise<number> {
    return this.waitingsRepository.getCurrentWaitingCnt(storeId);
  }

  // user:Users
  postWaitings(storeId: number, peopleCnt: number, user: Users): Promise<void> {
    this.waitingsRepository.postWaitings(storeId, peopleCnt, user); // ,user:Users
    return;
  }

  patchStatusOfWaitings(
    storeId: number,
    waitingId: number,
    status: WaitingStatus,
    user: Users,
  ): Promise<void> {
    this.waitingsRepository.patchStatusOfWaitings(
      storeId,
      waitingId,
      status,
      user,
    );
    return;
  }

  async getWaitingTime(
    storeId: number,
    waitingId: number,
    user: Users,
  ): Promise<number> {
    const storesTotalTableCnt = await this.waitingsRepository.getTableTotalCnt(
      storeId,
    );

    const waitingPeople: Waitings[] =
      await this.waitingsRepository.getWaitingsStatusWaiting(storeId);
    const waitingIdsArr = waitingPeople.map((e) => e.waitingId);

    // status 가 WAITING 인 사람 중에서 내가 몇등인지
    const myTurn = waitingIdsArr.indexOf(Number(waitingId)) + 1;

    const enteredPeople: Waitings[] =
      await this.waitingsRepository.getWaitingsStatusEntered(storeId);

    const bigCycle = Math.ceil(myTurn / enteredPeople.length); // 기다리는 사람들을 매장에 있는 사람들로 나눈 몫
    const left = myTurn % enteredPeople.length; // 그 나머지

    const leftCnt: number = left === 0 ? enteredPeople.length : left;

    console.log(bigCycle, leftCnt);

    const currentTime = new Date();
    const updatedTime = enteredPeople[leftCnt - 1].updatedAt;

    // 내가 앉을 테이블에 앉은 사람이 먹은지 몇분 됐는지
    const prePersonEatingTime = Math.floor(
      (currentTime.getTime() - updatedTime.getTime()) / 1000 / 60,
    );

    if (storesTotalTableCnt > enteredPeople.length) {
      return 0;
    } else {
      return bigCycle * 60 - prePersonEatingTime;
    }
  }
}
