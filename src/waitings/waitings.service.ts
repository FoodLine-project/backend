import { ReviewsRepository } from './../reviews/reviews.repository';
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
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull/dist/decorators';
import { Queue } from 'bull';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
@Injectable()
export class WaitingsService {
  constructor(
    @InjectRedis('ec2redis') private readonly redisClient: Redis,
    @InjectQueue('waitingQueue')
    private waitingQueue: Queue,
    private waitingsRepository: WaitingsRepository,
    private storesRepository: StoresRepository,
    private reviewsRepository: ReviewsRepository,
  ) {}

  //웨이팅 팀 수 조회
  async getCurrentWaitingsCnt(storeId: number): Promise<number> {
    const existsStore = await this.storesRepository.findStoreById(storeId);
    if (!existsStore) {
      throw new NotFoundException('음식점이 존재하지 않습니다');
    }
    // with Bullqueue
    // const job = await this.waitingQueue.add(
    //   'getCurrentWaitingCntInRedis',
    //   storeId,
    // );
    // const result = await job.finished();
    // return result;

    // without Bullqueue
    const waitingCnt: string = await this.redisClient.hget(
      `store:${storeId}`,
      'currentWaitingCnt',
    );
    return Number(waitingCnt);
  }

  //웨이팅 리스트 조회 ( for admin )
  async getWaitingList(
    storeId: number,
    user: Users,
  ): Promise<{ WAITING: Waitings[]; ENTERED: Waitings[] }> {
    if (user.StoreId !== storeId) {
      throw new UnauthorizedException('권한이 없습니다.');
    }
    const existsStore = await this.storesRepository.findStoreById(storeId);
    if (!existsStore) {
      throw new NotFoundException('음식점 존재하지 않습니다');
    }
    const list = await this.waitingsRepository.getWaitingListById(storeId);
    const ENTERED = list.filter((e) => e.status == WaitingStatus.ENTERED);
    console.log(ENTERED);
    const WAITING = list.filter(
      (e) =>
        e.status == WaitingStatus.WAITING ||
        e.status == WaitingStatus.CALLED ||
        e.status == WaitingStatus.DELAYED,
    );
    return { WAITING, ENTERED };
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
    let storeHash = await this.redisClient.hgetall(`store:${storeId}`);

    if (Object.keys(storeHash).length === 0) {
      const rating = await this.reviewsRepository.getAverageRating(storeId);
      storeHash = {
        maxWaitingCnt: `${existsStore.maxWaitingCnt}`,
        currentWaitingCnt: '0',
        cycleTime: `${existsStore.cycleTime}`,
        tableForTwo: `${existsStore.tableForTwo}`,
        tableForFour: `${existsStore.tableForFour}`,
        availableTableForTwo: `${existsStore.tableForTwo}`,
        availableTableForFour: `${existsStore.tableForFour}`,
        rating: `${rating}`,
      };
      await this.redisClient.hset(`store:${storeId}`, storeHash);
    }

    // const peopleCntForTables =
    //   peopleCnt <= 2
    //     ? Number(storeHash.availableTableForTwo)
    //     : Number(storeHash.availableTableForFour);

    // if (
    //   Number(peopleCntForTables) !== 0 &&
    //   !Number(storeHash.currentWaitingCnt)
    // ) {
    //   throw new ConflictException('해당 인원수는 바로 입장하실 수 있습니다');
    // }

    if (
      Number(storeHash.maxWaitingCnt) <= Number(storeHash.currentWaitingCnt)
    ) {
      throw new ConflictException('최대 웨이팅 수를 초과했습니다');
    }

    const existsUser = await this.waitingsRepository.getWaitingByUser(user);
    if (existsUser) {
      throw new ConflictException('이미 웨이팅을 신청하셨습니다');
    }

    try {
      const job = await this.waitingQueue.add('postWaitingWithRedis', {
        storeId,
        peopleCnt,
        user,
      });
      const finished = await job.finished();
      return finished;
    } catch (err) {
      throw new InternalServerErrorException('대기열 추가에 실패했습니다');
    }
  }

  //대기열 추가 없이 입장
  async postEntered(
    peopleCnt: number,
    storeId: number,
    userId: number,
    user: Users,
  ): Promise<string> {
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

    const tablesOfStoreInRedis = await this.redisClient.hgetall(
      `store:${storeId}`,
    );

    // 이미 redis 에 hash 가 있을때
    if (tablesOfStoreInRedis.tableForTwo !== undefined) {
      const availableTableForTwoFromRedis = Number(
        tablesOfStoreInRedis.availableTableForTwo,
      );
      const availableTableForFourFromRedis = Number(
        tablesOfStoreInRedis.availableTableForFour,
      );
      const peopleCntForTables =
        peopleCnt <= 2
          ? availableTableForTwoFromRedis
          : availableTableForFourFromRedis;

      if (Number(peopleCntForTables) == 0) {
        throw new ConflictException('자리가 없습니다');
      }
      const availableTableForTwo =
        peopleCnt <= 2
          ? availableTableForTwoFromRedis - 1
          : availableTableForTwoFromRedis;
      const availableTableForFour =
        peopleCnt <= 2
          ? availableTableForFourFromRedis
          : availableTableForFourFromRedis - 1;
      try {
        const job = await this.waitingQueue.add('addStoreHashAndPostEntered', {
          storeId,
          availableTableForTwo,
          availableTableForFour,
          userId,
          peopleCnt,
        });
        await job.finished();
        return 'success';
      } catch (err) {
        throw new InternalServerErrorException('입장에 실패했습니다');
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
      try {
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
        return 'success';
      } catch (err) {
        throw new InternalServerErrorException('입장에 실패했습니다');
      }
    }
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
      try {
        // with Bullqueue
        // const job = await this.waitingQueue.add('exitedAndIncrementTable', {
        //   storeId,
        //   waitingId,
        //   peopleCnt,
        // });
        // await job.finished();

        // without Bullqueue
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
        throw new InternalServerErrorException('퇴장에 실패했습니다');
      }
    } // ENTERED 를 EXITED_AND_READY로 처리하고 그 인원수에 맞는 대기열을 CALLED 처리 한다 => 매장용
    // 대기열이 없으면 부르지 않는다

    // 연기
    if (status === 'DELAYED') {
      if (
        waiting.status == WaitingStatus.CALLED ||
        waiting.status == WaitingStatus.WAITING
      ) {
      } else {
        throw new BadRequestException('적절하지 않은 status 입니다');
      }
      try {
        // with Bullqueue
        // const job = await this.waitingQueue.add('patchToDelayed', {
        //   storeId,
        //   waitingId,
        // });
        // await job.finished();

        // without Bullqueue
        await this.waitingsRepository.patchToDelayed(storeId, waitingId);
        return;
      } catch (err) {
        throw new InternalServerErrorException('웨이팅 연기에 실패했습니다');
      }
    } // 최근의 CALLED 된 사람을 DELAYED 로 바꾸고 다음 사람을 CALLED 한다 => 매장용

    // 입장
    if (status === 'ENTERED') {
      if (
        waiting.status == WaitingStatus.DELAYED ||
        waiting.status == WaitingStatus.CALLED ||
        waiting.status == WaitingStatus.WAITING
      ) {
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
        try {
          // with Bullqueue
          // const job = await this.waitingQueue.add('enteredAndDecrementCnts', {
          //   storeId,
          //   waitingId,
          //   status,
          //   peopleCnt,
          // });
          // await job.finished();

          // without Bullqueue
          await this.waitingsRepository.patchToEntered(
            storeId,
            waitingId,
            status,
          );
          let availableTable: string;
          if (peopleCnt == 1 || peopleCnt == 2) {
            availableTable = 'availableTableForTwo';
          } else {
            availableTable = 'availableTableForFour';
          }
          await this.redisClient.hincrby(
            `store:${storeId}`,
            availableTable,
            -1,
          );
          await this.redisClient.hincrby(
            `store:${storeId}`,
            'currentWaitingCnt',
            -1,
          );
          return;
        } catch (err) {
          throw new InternalServerErrorException('입장에 실패했습니다');
        }
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
      try {
        // with Bullqueue
        // const job = await this.waitingQueue.add(
        //   'canceledAndDecrementWaitingCnt',
        //   { storeId, waitingId },
        // );
        // await job.finished();

        // without Bullqueue
        await this.waitingsRepository.patchToCanceled(storeId, waitingId);
        await this.redisClient.hincrby(
          `store:${storeId}`,
          'currentWaitingCnt',
          -1,
        );
        return;
      } catch (err) {
        throw new InternalServerErrorException('웨이팅 취소에 실패했습니다');
      }
      // 여기까지 with redis
    } else {
      throw new BadRequestException('적절하지 않은 status 입니다');
    }
  }

  //노쇼 처리
  async checkAndPatchNoshow(): Promise<void> {
    console.log('Noshow Check');
    const delayed = await this.waitingsRepository.getAllDelayed();
    delayed.forEach(async (entity) => {
      const currentTime = new Date();
      const updatedAt = entity.updatedAt;
      const timePassed = Math.floor(
        (currentTime.getTime() - updatedAt.getTime()) / 1000 / 60,
      );

      if (timePassed >= 10) {
        entity.status = WaitingStatus.NOSHOW;

        try {
          // with Bullqueue
          // this.waitingQueue.add('saveNoshowAndDecrementWaitingCnt', {
          //   entity,
          // });

          //without
          await this.waitingsRepository.saveNoshow(entity);
          const storeId = entity.StoreId;
          await this.redisClient.hincrby(
            `store:${storeId}`,
            'currentWaitingCnt',
            -1,
          );
        } catch (err) {
          throw new InternalServerErrorException('노쇼 처리에 실패했습니다');
        }
        console.log(
          `waitingId ${entity.waitingId}의 상태가 NOSHOW가 되었습니다`,
        );
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
    if (existsWaiting.StoreId !== storeId) {
      throw new ConflictException('다른 가게에 웨이팅이 걸려있습니다');
    }
    if (
      existsWaiting.status === WaitingStatus.ENTERED ||
      existsWaiting.status === WaitingStatus.CANCELED ||
      existsWaiting.status === WaitingStatus.NOSHOW
    ) {
      throw new ConflictException('조회할 웨이팅이 올바른 상태가 아닙니다');
    }
    const peopleCnt = existsWaiting.peopleCnt;

    // with Bullqueue
    // const job = await this.waitingQueue.add('getStoreHashesFromRedis', storeId);
    // const storeHash = await job.finished();

    const storeHash = await this.redisClient.hgetall(`store:${storeId}`);
    let tableCnt: number;

    if (peopleCnt == 1 || peopleCnt == 2)
      tableCnt = Number(storeHash.tableForTwo);
    else tableCnt = Number(storeHash.tableForFour);

    const cycleTime = Number(storeHash.cycleTime);

    const people: { Waiting: Waitings[]; Entered: Waitings[] } =
      await this.waitingsRepository.getWaitingsStatusWaitingAndEntered(
        storeId,
        peopleCnt,
      );

    const waitingPeople = people.Waiting;
    const enteredPeople = people.Entered;
    const waitingIdsArr = waitingPeople.map((error) => error.waitingId);

    // for (let i = 0; enteredPeople.length == tableCnt; i++) {
    //   const considerAsEntered = waitingPeople.shift();
    //   enteredPeople.push(considerAsEntered);
    //   console.log(i);
    // }

    while (enteredPeople.length !== tableCnt) {
      const considerAsEntered = waitingPeople.shift();
      enteredPeople.push(considerAsEntered);
    }

    console.log('waitingPeople:', waitingPeople);
    console.log('enteredPeople:', enteredPeople);

    const myTurn = waitingIdsArr.indexOf(Number(existsWaiting.waitingId)) + 1;
    console.log('myTurn:', myTurn);

    if (tableCnt > enteredPeople.length || enteredPeople.length === 0) {
      if (waitingIdsArr.length === 0) return 0;
    }
    const bigCycle = Math.ceil(myTurn / tableCnt); // 기다리는 사람들을 매장에 있는 사람들로 나눈 몫
    console.log('bigCycle:', bigCycle);
    const left = myTurn % tableCnt; // 그 나머지
    console.log('left:', left);

    const leftCnt: number = left === 0 ? tableCnt : left;

    const currentTime = new Date();
    if (!enteredPeople[leftCnt - 1]) {
      throw new BadRequestException('비교할 대상이 존재하지 않습니다');
    }
    const updatedTime = enteredPeople[leftCnt - 1].updatedAt;
    const prePersonEatingTime = Math.floor(
      (currentTime.getTime() - updatedTime.getTime()) / 1000 / 60,
    );

    return bigCycle * cycleTime - prePersonEatingTime;
  }
}
