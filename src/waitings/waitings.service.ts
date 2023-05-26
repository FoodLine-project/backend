import { Users } from 'src/users/users.entity';
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

    const peopleWhoWaiting: Waitings[] =
      await this.waitingsRepository.getWaitingsStatusWaiting(storeId);
    const waitingIdArr = peopleWhoWaiting.map((e) => e.waitingId);

    const myTurn = waitingIdArr.indexOf(Number(waitingId)) + 1;

    const peopleWhoEntered =
      await this.waitingsRepository.getWaitingsStatusEntered(storeId);

    const bigCycle = Math.ceil(myTurn / peopleWhoEntered.length); // 기다리는 사람들을 매장에 있는 사람들로 나눈 몫
    const left = myTurn % peopleWhoEntered.length; // 그 나머지
    let leftCnt: number;
    if (left == 0) leftCnt = peopleWhoEntered.length;
    else leftCnt = left;

    console.log(bigCycle, leftCnt);

    const currnetTime = new Date();
    const updatedTime = peopleWhoEntered[leftCnt - 1].updatedAt;

    const passTimeOfWhoEnteredInMyTurn = Math.floor(
      (currnetTime.getTime() - updatedTime.getTime()) / 1000 / 60,
    );

    if (storesTotalTableCnt > peopleWhoEntered.length) return 0;
    else return bigCycle * 60 - passTimeOfWhoEnteredInMyTurn;
  }
}
