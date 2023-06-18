import { ReviewsRepository } from './../reviews/reviews.repository';
// import { RedisService } from './../redis/redis.service';
import { StoresRepository } from './../stores/stores.repository';
import { Users } from '../auth/users.entity';
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
import { TablesRepository } from '../tables/tables.repository';
import { InjectQueue } from '@nestjs/bull/dist/decorators';
import { Queue } from 'bull';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
@Injectable()
export class WaitingsService {
  constructor(
    @InjectRedis('waitingManager') private readonly redisClient: Redis,
    // @InjectRedis('local') private readonly redisClient: Redis,
    @InjectQueue('waitingQueue')
    private waitingQueue: Queue,
    private waitingsRepository: WaitingsRepository,
    private storesRepository: StoresRepository,
    private tablesRepository: TablesRepository,
    private reviewsRepository: ReviewsRepository,
  ) {}

  //웨이팅 팀 수 조회
  async getCurrentWaitingsCnt(storeId: number): Promise<number> {
    const existsStore = await this.storesRepository.findStoreById(storeId);
    if (!existsStore) {
      throw new NotFoundException('음식점이 존재하지 않습니다');
    }

    // const job = await this.waitingQueue.add('getCurrentWaitingCnt', storeId);

    const job = await this.waitingQueue.add(
      'getCurrentWaitingCntInRedis',
      storeId,
    );

    const result = await job.finished();
    return result;
  }

  //웨이팅 리스트 조회 ( for admin )
  async getWaitingList(storeId: number, user: Users): Promise<Waitings[]> {
    if (user.StoreId !== storeId) {
      throw new UnauthorizedException('권한이 없습니다.');
    }
    const existsStore = await this.storesRepository.findStoreById(storeId);
    if (!existsStore) {
      throw new NotFoundException('음식점 존재하지 않습니다');
    }
    const job = await this.waitingQueue.add('getWaitingListById', storeId);
    const result = await job.finished();
    return result;
  }

  //대기열 추가
  async postWaitings(
    storeId: number,
    peopleCnt: number,
    user: Users,
  ): Promise<string> {
    if (peopleCnt > 4) {
      throw new BadRequestException('최대 4명까지 신청할 수 있습니다');
    }
    const existsStore = await this.storesRepository.findStoreById(storeId);
    if (!existsStore) {
      throw new NotFoundException('음식점이 존재하지 않습니다');
    }
    // if (existsStore.maxWaitingCnt === existsStore.currentWaitingCnt) {
    //   return 'full';
    // }

    // const tablesOfStore = await this.tablesRepository.findTableById(storeId);

    const storeHash = await this.redisClient.hgetall(`store:${storeId}`);

    if (peopleCnt === 1 || peopleCnt === 2) {
      if (
        Number(storeHash.availableTableForTwo) !== 0 &&
        Number(storeHash.currentWaitingCnt) == 0
      ) {
        throw new ConflictException('해당 인원수는 바로 입장하실 수 있습니다');
      }
    } else {
      if (
        Number(storeHash.availableTableForFour) !== 0 &&
        Number(storeHash.currentWaitingCnt) == 0
      ) {
        throw new ConflictException('해당 인원수는 바로 입장하실 수 있습니다');
      }
    }
    if (storeHash.maxWaitingCnt == storeHash.currentWaitingCnt) {
      throw new ConflictException('최대 웨이팅 수를 초과했습니다');
    }
    const existsUser = await this.waitingsRepository.getWaitingByUser(user);
    if (existsUser) {
      throw new ConflictException('이미 웨이팅을 신청하셨습니다');
    }

    // 여기부터
    // without redis
    // const job1 = await this.waitingQueue.add('postWaiting', {
    //   storeId,
    //   peopleCnt,
    //   user,
    // });
    // await job1.finished();
    // const job = await this.waitingQueue.add(
    //   'incrementCurrentWaitingCnt',
    //   storeId,
    // );
    // 여기까지 without redis

    // with redis
    // await this.waitingQueue.add('incrementCurrentWaitingCntInRedis', storeId);

    // finally one add to queue
    // 여기부터
    const job = await this.waitingQueue.add('postWaitingWithRedis', {
      storeId,
      peopleCnt,
      user,
    });
    // 여기까지 with redis
    await job.finished();
    return 'success';
  }

  //대기열 추가 없이 입장
  async postEntered(
    storeId: number,
    userId: number,
    peopleCnt: number,
    user: Users,
  ): Promise<void> {
    const existsStore = await this.storesRepository.findStoreById(storeId);
    if (peopleCnt > 4) {
      throw new BadRequestException('최대 4명까지 신청할 수 있습니다');
    }
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
    // const tablesOfStore = await this.tablesRepository.findTableById(storeId);

    // if (peopleCnt == 1 || peopleCnt == 2) {
    //   if (tablesOfStore.availableTableForTwo == 0) {
    //     throw new ConflictException('자리가 없습니다');
    //   }
    // } else {
    //   if (tablesOfStore.availableTableForFour == 0) {
    //     throw new ConflictException('자리가 없습니다');
    //   }
    // }

    // 여기부터
    const tablesOfStoreInRedis = await this.redisClient.hgetall(
      `store:${storeId}`,
    );

    // 이미 redis 에 hash 가 있을때
    if (tablesOfStoreInRedis.tableForTwo !== undefined) {
      let availableTableForTwo: number;
      let availableTableForFour: number;
      if (peopleCnt == 1 || peopleCnt == 2) {
        if (Number(tablesOfStoreInRedis.availableTableForTwo) == 0) {
          throw new ConflictException('자리가 없습니다');
        }
        availableTableForTwo =
          Number(tablesOfStoreInRedis.availableTableForTwo) - 1;
        availableTableForFour = Number(
          tablesOfStoreInRedis.availableTableForFour,
        );
        // await this.waitingQueue.add('addStoreHashes', {
        //   storeId,
        //   availableTableForTwo,
        //   availableTableForFour,
        // });
        // await this.waitingQueue.add('postEntered', {
        //   storeId,
        //   userId,
        //   peopleCnt,
        // });
        const job = await this.waitingQueue.add('addStoreHashAndPostEntered', {
          storeId,
          availableTableForTwo,
          availableTableForFour,
          userId,
          peopleCnt,
        });
        await job.finished();
        return;
      } else {
        if (Number(tablesOfStoreInRedis.availableTableForFour) == 0) {
          throw new ConflictException('자리가 없습니다');
        }
        availableTableForTwo = Number(
          tablesOfStoreInRedis.availableTableForTwo,
        );
        availableTableForFour =
          Number(tablesOfStoreInRedis.availableTableForFour) - 1;
        // await this.waitingQueue.add('addStoreHashes', {
        //   storeId,
        //   availableTableForTwo,
        //   availableTableForFour,
        // });
        // await this.waitingQueue.add('postEntered', {
        //   storeId,
        //   userId,
        //   peopleCnt,
        // });
        const job = await this.waitingQueue.add('addStoreHashAndPostEntered', {
          storeId,
          availableTableForTwo,
          availableTableForFour,
          userId,
          peopleCnt,
        });
        await job.finished();
        return;
      }
    } else {
      // redis 에 hash 가 없을때
      const average: number = await this.reviewsRepository.getAverageRating(
        storeId,
      );
      let availableTableForTwo = existsStore.tableForTwo;
      let availableTableForFour = existsStore.tableForFour;
      const maxWaitingCnt = existsStore.maxWaitingCnt;
      const cycleTime = existsStore.cycleTime;
      const tableForTwo = existsStore.tableForTwo;
      const tableForFour = existsStore.tableForFour;
      const currentWaitingCnt = 0;
      if (peopleCnt == 1 || peopleCnt == 2) {
        availableTableForTwo = availableTableForTwo - 1;
      } else {
        availableTableForFour = availableTableForFour - 1;
      }
      // await this.waitingQueue.add('postEntered', {
      //   storeId,
      //   userId,
      //   peopleCnt,
      // });
      // await this.waitingQueue.add('addStoreHashes', {
      //   storeId,
      //   maxWaitingCnt,
      //   currentWaitingCnt,
      //   cycleTime,
      //   tableForTwo,
      //   tableForFour,
      //   availableTableForTwo,
      //   availableTableForFour,
      //   rating: average,
      // });
      // return;
      const job = await this.waitingQueue.add('addStoreHashAndPostEntered', {
        storeId,
        userId,
        peopleCnt,
        maxWaitingCnt,
        currentWaitingCnt,
        cycleTime,
        tableForTwo,
        tableForFour,
        availableTableForTwo,
        availableTableForFour,
        rating: average,
      });
      await job.finished();
      return;
    }
    // 여기까지 with redis

    // 여기부터
    // without Redis
    // const job1 = await this.waitingQueue.add('postEntered', {
    //   storeId,
    //   userId,
    //   peopleCnt,
    // });
    // await job1.finished();
    // const job = await this.waitingQueue.add('decrementTables', {
    //   storeId,
    //   peopleCnt,
    // });
    // await job.finished();
    // return;
    // 여기까지 without redis

    // // with Redis
    // await this.waitingQueue.add('addStoresHashes', {
    //   storeId,
    //   availableTableForTwo,
    //   availableTableForFour,
    //   maxWaitingCnt,
    //   peopleCnt,
    //   cycleTime,
    // });
  }

  //웨이팅 상태 변경
  async patchStatusOfWaitings(
    storeId: number,
    waitingId: number,
    status: WaitingStatus,
    user: Users,
  ): Promise<void> {
    if (user.StoreId != storeId) {
      throw new UnauthorizedException('권한이 없습니다');
    }
    const existsStore = await this.storesRepository.findStoreById(storeId);
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
    // 퇴장
    if (status === 'EXITED') {
      if (waiting.status !== WaitingStatus.ENTERED) {
        throw new BadRequestException('적절하지 않은 status 입니다');
      }
      //여기부터
      // without redis
      // await this.waitingQueue.add('patchToExited', { storeId, waitingId });
      // await this.waitingQueue.add('incrementTables', { storeId, peopleCnt });
      // 여기까지 without redis

      // // with redis
      // await this.waitingQueue.add('incrementTableInRedis', {
      //   storeId,
      //   peopleCnt,
      // });

      // 여기부터
      const job = await this.waitingQueue.add('exitedAndIncrementTable', {
        storeId,
        waitingId,
        peopleCnt,
      });
      await job.finished();
      return;
      // 여기까지 with redis
    } // ENTERED 를 EXITED_AND_READY로 처리하고 그 인원수에 맞는 대기열을 CALLED 처리 한다 => 매장용
    // 대기열이 없으면 부르지 않는다

    // 연기
    if (status === 'DELAYED') {
      if (waiting.status !== WaitingStatus.CALLED) {
        throw new BadRequestException('적절하지 않은 status 입니다');
      }
      this.waitingQueue.add('patchToDelayed', { storeId, waitingId });
      return;
    } // 최근의 CALLED 된 사람을 DELAYED 로 바꾸고 다음 사람을 CALLED 한다 => 매장용

    // 입장
    if (status === 'ENTERED') {
      if (
        waiting.status == WaitingStatus.DELAYED ||
        waiting.status == WaitingStatus.CALLED ||
        waiting.status == WaitingStatus.WAITING
      ) {
        // 여기부터
        // this.waitingQueue.add('patchToEntered', { storeId, waitingId, status });

        // // without redis
        // this.waitingQueue.add('decrementTables', { storeId, peopleCnt });
        // this.waitingQueue.add('decrementCurrentWaitingCnt', storeId);
        // 여기까지 without redis

        // // with redis
        // this.waitingQueue.add('decrementTableInRedis', { storeId, peopleCnt });
        // this.waitingQueue.add('decrementCurrentWaitingCntInRedis', storeId);

        // 여기부터
        const tablesOfStoreInRedis = await this.redisClient.hgetall(
          `store:${storeId}`,
        );
        if (peopleCnt == 1 || peopleCnt == 2) {
          if (Number(tablesOfStoreInRedis.availableTableForTwo) == 0) {
            throw new ConflictException('자리가 없습니다');
          }
        } else {
          if (Number(tablesOfStoreInRedis.availableTableForFour) == 0) {
            throw new ConflictException('자리가 없습니다');
          }
        }
        const job = await this.waitingQueue.add('enteredAndDecrementCnts', {
          storeId,
          waitingId,
          status,
          peopleCnt,
        });
        await job.finished();
        return;
        // 여가까지 with redis
      } else {
        throw new BadRequestException('적절하지 않은 status 입니다');
      }
    } // DELAYED, CALLED, WAITING 을 ENTERED 로 바꾸고 입장시킨다 => 매장용
  }

  //웨이팅 취소
  async patchStatusToCanceled(storeId: number, user: Users): Promise<void> {
    const existsStore = await this.storesRepository.findStoreById(storeId);
    if (!existsStore) {
      throw new NotFoundException('음식점이 존재하지 않습니다');
    }
    const waiting = await this.waitingsRepository.getWaitingByUser(user);
    if (!waiting) {
      throw new ConflictException('웨이팅이 존재하지 않습니다');
    }
    const waitingId = waiting.waitingId;
    if (waiting.StoreId !== storeId) {
      throw new BadRequestException('잘못된 요청입니다');
    }
    if (
      waiting.status == WaitingStatus.CALLED ||
      waiting.status == WaitingStatus.DELAYED ||
      waiting.status == WaitingStatus.WAITING
    ) {
      // 여기부터
      // this.waitingQueue.add('patchToCanceled', { storeId, waitingId });

      // //without redis
      // this.waitingQueue.add('decrementCurrentWaitingCnt', storeId);
      // 여기까지 without redis

      // //with redis
      // this.waitingQueue.add('decrementCurrentWaitingCntInRedis', storeId);

      // 여기부터
      const job = await this.waitingQueue.add(
        'canceledAndDecrementWaitingCnt',
        { storeId, waitingId },
      );
      await job.finished();
      return;
      // 여기까지 with redis
    } else {
      throw new BadRequestException('적절하지 않은 status 입니다');
    }
  }

  //노쇼 처리
  async checkAndPatchNoshow(): Promise<void> {
    //console.log('실행중');
    const delayed = await this.waitingsRepository.getAllDelayed();
    delayed.forEach((entity) => {
      const currentTime = new Date();
      const updatedAt = entity.updatedAt;
      const timePassed = Math.floor(
        (currentTime.getTime() - updatedAt.getTime()) / 1000 / 60,
      );

      if (timePassed >= 10) {
        entity.status = WaitingStatus.NOSHOW;
        // this.waitingQueue.add('saveNoshow', { entity });

        // // without redis
        // // this.waitingQueue.add('decrementCurrentWaitingCnt', entity.StoreId);

        // //with redis
        // this.waitingQueue.add(
        //   'decrementCurrentWaitingCntInRedis',
        //   entity.StoreId,
        // );

        this.waitingQueue.add('saveNoshowAndDecrementWaitingCnt', {
          entity,
        });
        //console.log(
        //  `waitingId ${entity.waitingId}의 상태가 NOSHOW가 되었습니다`,
        //);
      }
    });
    return;
  }

  //예상 대기 시간 조회
  async getWaitingTime(storeId: number, user: Users): Promise<number> {
    const existsStore = await this.storesRepository.findStoreById(storeId);
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
    const peopleCnt = existsWaiting.peopleCnt;

    // 여기부터
    // const cycleTime = await this.storesRepository.getCycleTimeByStoreId(
    //   storeId,
    // );

    // // without redis
    // const tableCnt = await this.waitingsRepository.getTableTotalCnt(
    //   storeId,
    //   peopleCnt,
    // ); // 사람 수에 맞는 테이블의 갯수
    // 여기까지 without redis

    // 여기부터
    // with redis
    const job = await this.waitingQueue.add('getStoreHashesFromRedis', storeId);
    const storeHash = await job.finished();

    let tableCnt: number;

    if (peopleCnt == 1 || peopleCnt == 2) tableCnt = storeHash.tableForTwo;
    else tableCnt = storeHash.tableForFour;

    const cycleTime = storeHash.cycleTime;
    // 여기까지 with redis

    // const waitingPeople: Waitings[] =
    //   await this.waitingsRepository.getWaitingsStatusWaiting(
    //     storeId,
    //     peopleCnt,
    //   );

    // const enteredPeople: Waitings[] =
    //   await this.waitingsRepository.getWaitingsStatusEntered(
    //     storeId,
    //     peopleCnt,
    //   );

    const people: { Waiting: Waitings[]; Entered: Waitings[] } =
      await this.waitingsRepository.getWaitingsStatusWaitingAndEntered(
        storeId,
        peopleCnt,
      );

    const waitingPeople = people.Waiting;
    const enteredPeople = people.Entered;
    const waitingIdsArr = waitingPeople.map((error) => error.waitingId);
    const myTurn = waitingIdsArr.indexOf(Number(existsWaiting.waitingId)) + 1;

    if (tableCnt > enteredPeople.length || enteredPeople.length === 0) {
      if (waitingIdsArr.length === 0) return 0;
    }
    const bigCycle = Math.ceil(myTurn / tableCnt); // 기다리는 사람들을 매장에 있는 사람들로 나눈 몫
    const left = myTurn % tableCnt; // 그 나머지

    const leftCnt: number = left === 0 ? tableCnt : left;

    const currentTime = new Date();
    if (!enteredPeople[leftCnt - 1]) {
      throw new BadRequestException('비교할 대상이 존재하지 않습니다');
    }
    const updatedTime = enteredPeople[leftCnt - 1].updatedAt;
    if (
      bigCycle == 1 &&
      enteredPeople[leftCnt - 1].status == 'EXITED_AND_READY'
    ) {
      return 0;
    }

    const prePersonEatingTime = Math.floor(
      (currentTime.getTime() - updatedTime.getTime()) / 1000 / 60,
    );

    return bigCycle * cycleTime - prePersonEatingTime;
  }
}
