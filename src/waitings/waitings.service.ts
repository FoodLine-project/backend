import { StoresRepository } from './../stores/stores.repository';
import { Users } from 'src/auth/users.entity';
import { WaitingStatus } from './waitingStatus.enum';
import { Waitings } from './waitings.entity';
import { WaitingsRepository } from './waitings.repository';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { TablesRepository } from 'src/tables/tables.repository';
import { InjectQueue } from '@nestjs/bull/dist/decorators';
import { Queue } from 'bull';
@Injectable()
export class WaitingsService {
  constructor(
    @InjectQueue('waitingQueue')
    private waitingQueue: Queue,
    private waitingsRepository: WaitingsRepository,
    private storesRepository: StoresRepository,
    private tablesRepository: TablesRepository,
  ) {}

  async getCurrentWaitingsCnt(storeId: number): Promise<number> {
    const existsStore = await this.storesRepository.findOne({
      where: { storeId },
    });
    if (!existsStore) {
      throw new NotFoundException('음식점이 존재하지 않습니다');
    }
    const job = await this.waitingQueue.add('getCurrentWaitingCnt', storeId);
    const result = await job.finished();
    return result;
  }

  async getWaitingList(storeId: number, user: Users): Promise<Waitings[]> {
    if (user.StoreId !== storeId) {
      throw new UnauthorizedException('권한이 없습니다.');
    }
    const existsStore = await this.storesRepository.findOne({
      where: { storeId },
    });
    if (!existsStore) {
      throw new NotFoundException('음식점 존재하지 않습니다');
    }
    const job = await this.waitingQueue.add('getWaitingListById', storeId);
    const result = await job.finished();
    return result;
  }

  async postWaitings(
    storeId: number,
    peopleCnt: number,
    user: Users,
  ): Promise<string> {
    const existsStore = await this.storesRepository.findOne({
      where: { storeId },
    });
    if (!existsStore) {
      throw new NotFoundException('음식점이 존재하지 않습니다');
    }
    if (existsStore.maxWaitingCnt === existsStore.currentWaitingCnt) {
      return 'full';
    }
    const tablesOfStore = await this.tablesRepository.findOne({
      where: { StoreId: storeId },
    });
    if (peopleCnt === 1 || peopleCnt === 2) {
      if (tablesOfStore.availableTableForTwo !== 0) {
        throw new ConflictException('해당 인원수는 바로 입장하실 수 있습니다');
      }
    } else {
      if (tablesOfStore.availableTableForFour !== 0) {
        throw new ConflictException('해당 인원수는 바로 입장하실 수 있습니다');
      }
    }
    const existsUser = await this.waitingsRepository.getWaitingByUser(user);
    if (existsUser) {
      throw new ConflictException('이미 웨이팅을 신청하셨습니다');
    }
    this.waitingQueue.add('postWaiting', { storeId, peopleCnt, user });
    this.waitingQueue.add('incrementCurrentWaitingCnt', storeId);
    return 'success';
  }

  async postEntered(
    storeId: number,
    userId: number,
    peopleCnt: number,
    user: Users,
  ): Promise<void> {
    const existsStore = await this.storesRepository.findOne({
      where: { storeId },
    });
    if (!existsStore) {
      throw new NotFoundException('음식점이 존재하지 않습니다');
    }
    if (user.StoreId !== storeId) {
      throw new UnauthorizedException('권한이 없습니다');
    }
    const existsUser = await this.waitingsRepository.getWaitingByUserId(userId);
    if (existsUser) {
      throw new ConflictException('이미 웨이팅이 신청되어있습니다');
    }
    const tablesOfStore = await this.tablesRepository.findOne({
      where: { StoreId: storeId },
    });
    if (peopleCnt === 1 || peopleCnt === 2) {
      if (tablesOfStore.availableTableForTwo === 0) {
        throw new ConflictException('자리가 없습니다');
      }
    } else {
      if (tablesOfStore.availableTableForFour === 0) {
        throw new ConflictException('자리가 없습니다');
      }
    }
    await this.waitingQueue.add('postEntered', { storeId, userId, peopleCnt });
    await this.waitingQueue.add('decrementTables', { storeId, peopleCnt });
    return;
  }

  async patchStatusOfWaitings(
    storeId: number,
    waitingId: number,
    status: WaitingStatus,
    user: Users,
  ): Promise<void> {
    if (user.StoreId != storeId) {
      throw new UnauthorizedException('권한이 없습니다');
    }
    const existsStore = await this.storesRepository.findOne({
      where: { storeId },
    });
    if (!existsStore) {
      throw new NotFoundException('음식점이 존재하지 않습니다');
    }
    const waiting = await this.waitingsRepository.getWaitingByWaitingId(
      waitingId,
    );
    if (!waiting) {
      throw new ConflictException('웨이팅이 존재하지 않습니다');
    }
    const peopleCnt = waiting.peopleCnt;
    if (status === 'EXITED') {
      if (waiting.status !== WaitingStatus.ENTERED) {
        throw new BadRequestException('적절하지 않은 status 입니다');
      }
      await this.waitingQueue.add('patchToExited', { storeId, waitingId });
      await this.waitingQueue.add('incrementTables', { storeId, peopleCnt });
      return;
    } // ENTERED 를 NOTFILLED로 처리하고 그 인원수에 맞는 대기열을 CALLED 처리 한다 => 매장용
    // 대기열이 없으면 부르지 않는다

    if (status === 'DELAYED') {
      if (waiting.status !== WaitingStatus.CALLED) {
        throw new BadRequestException('적절하지 않은 status 입니다');
      }
      this.waitingQueue.add('patchToDelayed', { storeId, waitingId });
      return;
    } // 최근의 CALLED 된 사람을 DELAYED 로 바꾸고 다음 사람을 CALLED 한다 => 매장용

    if (status === 'ENTERED') {
      if (
        waiting.status == WaitingStatus.DELAYED ||
        waiting.status == WaitingStatus.CALLED ||
        waiting.status == WaitingStatus.WAITING
      ) {
        this.waitingQueue.add('patchToEntered', { storeId, waitingId, status });
        this.waitingQueue.add('decrementTables', { storeId, peopleCnt });
        this.waitingQueue.add('decrementCurrentWaitingCnt', storeId);
      } else {
        throw new BadRequestException('적절하지 않은 status 입니다');
      }
      return;
    } // DELAYED, CALLED, WAITING 을 ENTERED 로 바꾸고 입장시킨다 => 매장용
  }

  async patchStatusToCanceled(storeId: number, user: Users): Promise<void> {
    const existsStore = await this.storesRepository.findOne({
      where: { storeId },
    });
    if (!existsStore) {
      throw new NotFoundException('음식점이 존재하지 않습니다');
    }
    const waiting = await this.waitingsRepository.getWaitingByUser(user);
    if (!waiting) {
      throw new ConflictException('웨이팅이 존재하지 않습니다');
    }
    const waitingId = waiting.waitingId;
    if (
      waiting.status == WaitingStatus.CALLED ||
      waiting.status == WaitingStatus.DELAYED ||
      waiting.status == WaitingStatus.WAITING
    ) {
      this.waitingQueue.add('patchToCanceled', { storeId, waitingId });
      this.waitingQueue.add('decrementCurrentWaitingCnt', storeId);
      return;
    } else {
      throw new BadRequestException('적절하지 않은 status 입니다');
    }
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
        this.waitingQueue.add('saveNoshow', { entity });
        this.waitingQueue.add('decrementCurrentWaitingCnt', entity.StoreId);
        console.log(
          `waitingId ${entity.waitingId}의 상태가 NOSHOW가 되었습니다`,
        );
      }
    });
    return;
  }

  async getWaitingTime(storeId: number, user: Users): Promise<number> {
    const existsStore = await this.storesRepository.findOne({
      where: { storeId },
    });
    if (!existsStore) {
      throw new NotFoundException('음식점이 존재하지 않습니다');
    }
    const existsWaiting = await this.waitingsRepository.getWaitingByUser(user);
    if (!existsWaiting) {
      throw new ConflictException('웨이팅이 존재하지 않습니다');
    }
    if (
      existsWaiting.status === WaitingStatus.ENTERED ||
      existsWaiting.status === WaitingStatus.CANCELED ||
      existsWaiting.status === WaitingStatus.NOSHOW
    ) {
      throw new ConflictException('조회할 웨이팅이 올바른 상태가 아닙니다');
    }

    const cycleTime = await this.storesRepository.getCycleTimeByStoreId(
      storeId,
    );

    const peopleCnt = existsWaiting.peopleCnt;

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
    console.log(waitingIdsArr, '여기다');
    // status 가 WAITING 인 사람 중에서 내가 몇등인지
    const myTurn = waitingIdsArr.indexOf(Number(existsWaiting.waitingId)) + 1;
    console.log(myTurn);

    const enteredPeople: Waitings[] =
      await this.waitingsRepository.getWaitingsStatusEntered(
        storeId,
        peopleCnt,
      );
    console.log(enteredPeople.map((e) => e.waitingId));
    if (tableCnt > enteredPeople.length || enteredPeople.length === 0) {
      if (waitingIdsArr.length === 0) return 0;
    }
    const bigCycle = Math.ceil(myTurn / tableCnt); // 기다리는 사람들을 매장에 있는 사람들로 나눈 몫
    const left = myTurn % tableCnt; // 그 나머지

    const leftCnt: number = left === 0 ? tableCnt : left;

    console.log(bigCycle, leftCnt);

    const currentTime = new Date();
    const updatedTime = enteredPeople[leftCnt - 1].updatedAt;
    console.log(enteredPeople[leftCnt - 1].waitingId, '얘랑 비교');
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
