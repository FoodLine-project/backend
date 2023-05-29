import { StoresRepository } from './../stores/stores.repository';
import { Users } from 'src/users/users.entity';
import { WaitingStatus } from './waitingStatus.enum';
import { Waitings } from './waitings.entity';
import { WaitingsRepository } from './waitings.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WaitingsService {
  constructor(
    private waitingsRepository: WaitingsRepository,
    private storesRepository: StoresRepository,
  ) {}

  getCurrentWaitingsCnt(storeId: number): Promise<number> {
    return this.waitingsRepository.getCurrentWaitingCnt(storeId);
  }

  // 가게가 꽉 차있는 경우 웨이팅 신청
  postWaitings(storeId: number, peopleCnt: number, user: Users): Promise<void> {
    this.waitingsRepository.postWaitings(storeId, peopleCnt, user); // ,user:Users
    return;
  }

  // 가게에 자리가 있어 바로
  postEntered(storeId: number, peopleCnt: number, user: Users): Promise<void> {
    this.waitingsRepository.postEntered(storeId, peopleCnt, user); // ,user:Users
    return;
  }

  patchStatusOfWaitings(
    storeId: number,
    waitingId: number,
    status: WaitingStatus,
  ): Promise<void> {
    // this.waitingsRepository.patchStatusOfWaitings(
    //   storeId,
    //   waitingId,
    //   status,
    //   user,
    // );
    // return;
    if (status === 'EXITED') {
      this.waitingsRepository.patchToEXITED(storeId, waitingId);
      return;
    } // 퇴장 처리를 하고 그 인원수에 맞는 대기열을 CALLED 처리 한다 => 매장용

    if (status === 'DELAYED') {
      this.waitingsRepository.patchToDELAYED(storeId, waitingId);
      return;
    } // 최근의 CALLED 된 사람을 DELAYED 로 바꾸고 다음 사람을 CALLED 한다 => 매장용

    if (status === 'ENTERED') {
      this.waitingsRepository.patchStatus(storeId, waitingId, status);
      return;
    } // DELAYED, CALLED, WAITING 을 ENTERED 로 바꾸고 입장시킨다 => 매장용

    if (status === 'CANCELED') {
      this.waitingsRepository.patchStatus(storeId, waitingId, status);
      return;
    } // 손님이 웨이팅을 취소한다 => 손님용
  }

  async checkAndPatchNoshow(): Promise<void> {
    console.log('실행중');
    const delayed = await this.waitingsRepository.getAllDelayed();
    delayed.forEach((entity) => {
      const currentTime = new Date();
      const updatedAt = entity.updatedAt;
      const timePassed = Math.floor(
        (currentTime.getTime() - updatedAt.getTime()) / 1000 / 60,
      );

      if (timePassed >= 10) {
        entity.status = WaitingStatus.NOSHOW;
        this.waitingsRepository.save(entity);
        console.log(
          `waitingId ${entity.waitingId}의 상태가 NOSHOW가 되었습니다`,
        );
      }
    });
    return;
  }

  async getWaitingTime(
    storeId: number,
    waitingId: number,
    user: Users,
  ): Promise<number> {
    const cycleTime = await this.storesRepository.getCycleTimeByStoreId(
      storeId,
    );

    const peopleCnt = await this.waitingsRepository.getPeopleCnt(
      storeId,
      waitingId,
      user,
    ); // 대기를 건 사람의 수

    const tableCnt = await this.waitingsRepository.getTableTotalCnt(
      storeId,
      peopleCnt,
    ); // 사람 수에 맞는 테이블의 갯수

    const waitingPeople: Waitings[] =
      await this.waitingsRepository.getWaitingsStatusWaiting(
        storeId,
        peopleCnt,
      );
    const waitingIdsArr = waitingPeople.map((e) => e.waitingId);

    // status 가 WAITING 인 사람 중에서 내가 몇등인지
    const myTurn = waitingIdsArr.indexOf(Number(waitingId)) + 1;

    const enteredPeople: Waitings[] =
      await this.waitingsRepository.getWaitingsStatusEntered(
        storeId,
        peopleCnt,
      );

    if (tableCnt > enteredPeople.length || enteredPeople.length === 0) {
      return 0;
    }

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
    console.log(
      '해당 테이블에 있는 사람이 입장한지 몇분 지났는지?',
      prePersonEatingTime,
    );

    return bigCycle * cycleTime - prePersonEatingTime;
  }
}
