import { InjectRepository } from '@nestjs/typeorm';
import { Waitings } from './waitings.entity';
import { In, Repository } from 'typeorm';
import { WaitingStatus } from './waitingStatus.enum';
import { Users } from '../auth/users.entity';
export class WaitingsRepository {
  constructor(
    @InjectRepository(Waitings) private waitings: Repository<Waitings>,
  ) { }

  //웨이팅 팀 수 조회
  async getCurrentWaitingCnt(storeId: number): Promise<number> {
    const waitingStatuses = [
      WaitingStatus.WAITING,
      WaitingStatus.CALLED,
      WaitingStatus.DELAYED,
    ];

    const waitingCounts = await this.waitings
      .createQueryBuilder('waitings')
      .leftJoin('waitings.store', 'store')
      .where('store.storeId = :storeId', { storeId })
      .andWhere('waitings.status IN (:...statuses)', {
        statuses: waitingStatuses,
      })
      .getCount();
    return waitingCounts;
  }

  //웨이팅 리스트 조회
  async getWaitingListById(storeId: number): Promise<Waitings[]> {
    return await this.waitings.find({
      where: {
        StoreId: storeId,
        status: In([
          WaitingStatus.WAITING,
          WaitingStatus.CALLED,
          WaitingStatus.DELAYED,
          WaitingStatus.ENTERED,
        ]),
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  //웨이팅 조회 By User
  async getWaitingByUser(user: Users): Promise<Waitings> {
    return await this.waitings.findOne({
      where: {
        UserId: user.userId,
        status: In([
          WaitingStatus.WAITING,
          WaitingStatus.CALLED,
          WaitingStatus.DELAYED,
          WaitingStatus.ENTERED,
        ]),
      },
    });
  }

  //웨이팅 조회 By UserId
  async getWaitingByUserId(userId: number): Promise<Waitings> {
    return await this.waitings.findOne({
      where: {
        UserId: userId,
        status: In([
          WaitingStatus.WAITING,
          WaitingStatus.CALLED,
          WaitingStatus.DELAYED,
          WaitingStatus.ENTERED,
        ]),
      },
    });
  }

  //웨이팅 조회 By WaitingId
  async getWaitingByWaitingId(waitingId: number): Promise<Waitings> {
    return await this.waitings.findOne({
      where: { waitingId },
    });
  }

  //웨이팅 등록
  async postWaitings(
    storeId: number,
    peopleCnt: number,
    user: Users,
  ): Promise<Waitings> {
    const waiting = this.waitings.create({
      StoreId: storeId,
      UserId: user.userId,
      peopleCnt,
    });
    return await this.waitings.save(waiting);
  }

  //웨이팅 등록 없이 입장
  async postEntered(
    storeId: number,
    userId: number,
    peopleCnt: number,
  ): Promise<void> {
    const waiting = this.waitings.create({
      StoreId: storeId,
      UserId: userId,
      peopleCnt,
      status: WaitingStatus.ENTERED,
    });
    await this.waitings.save(waiting);
    return;
  }

  //퇴장
  async patchToExited(storeId: number, waitingId: number): Promise<void> {
    const exited = await this.waitings.findOne({
      where: { waitingId },
    });
    exited.status = WaitingStatus.EXITED;
    await this.waitings.save(exited)
    // await this.waitings
    //   .createQueryBuilder('waitings')
    //   .update(Waitings)
    //   .set({
    //     status: WaitingStatus.EXITED_AND_READY,
    //     updatedAt: () => 'updatedAt',
    //   })
    //   .where('waitingId = :waitingId', { waitingId })
    //   .setParameter('updatedAt', exited.updatedAt)
    //   .execute();

    const peopleCntForTables = exited.peopleCnt <= 2 ? [1, 2] : [3, 4];
    const called = await this.waitings.findOne({
      where: {
        StoreId: storeId,
        status: WaitingStatus.WAITING,
        peopleCnt: In(peopleCntForTables),
      },
    });
    if (!called) return;
    called.status = WaitingStatus.CALLED;
    await this.waitings.save(called);
    return;
  }

  //연기
  async patchToDelayed(storeId: number, waitingId: number): Promise<void> {
    const delayed = await this.waitings.findOne({
      where: { waitingId },
    });
    delayed.status = WaitingStatus.DELAYED;
    await this.waitings.save(delayed);

    const peopleCntForTables = delayed.peopleCnt <= 2 ? [1, 2] : [3, 4];
    const called = await this.waitings.findOne({
      where: {
        StoreId: storeId,
        status: WaitingStatus.WAITING,
        peopleCnt: In(peopleCntForTables),
      },
      order: {
        createdAt: 'ASC',
      },
    });
    if (!called) return;
    called.status = WaitingStatus.CALLED;
    await this.waitings.save(called);
    return;
  }

  //입장
  async patchToEntered(
    storeId: number,
    waitingId: number,
    status: WaitingStatus,
  ): Promise<void> {
    const entered = await this.waitings.findOne({
      where: { waitingId },
    });
    entered.status = status;
    await this.waitings.save(entered);
    return;
  }

  //웨이팅 취소 ( for user )
  async patchToCanceled(storeId: number, waitingId: number): Promise<void> {
    const canceled = await this.waitings.findOne({
      where: { waitingId, StoreId: storeId },
    });
    canceled.status = WaitingStatus.CANCELED;
    await this.waitings.save(canceled);
    return;
  }

  //연기목록 조회
  async getAllDelayed(): Promise<Waitings[]> {
    return await this.waitings.find({
      where: { status: WaitingStatus.DELAYED },
    });
  }

  //noshow
  async saveNoshow(waitings: Waitings): Promise<void> {
    await this.waitings.save(waitings);
    return;
  }

  //상태가 Waiting 인 목록 조회
  async getWaitingsStatusWaiting(
    storeId: number,
    peopleCnt: number,
  ): Promise<Waitings[]> {
    const peopleCntForTables = peopleCnt <= 2 ? [1, 2] : [3, 4];
    return await this.waitings.find({
      where: {
        StoreId: storeId,
        status: In([
          WaitingStatus.WAITING,
          WaitingStatus.CALLED,
          WaitingStatus.DELAYED,
        ]),
        peopleCnt: In(peopleCntForTables),
      },
      order: {
        createdAt: 'ASC', // 생성일 기준 오름차순 정렬
      },
    });
  }

  //상태가 Entered 인 목록 조회
  async getWaitingsStatusEntered(
    storeId: number,
    peopleCnt: number,
  ): Promise<Waitings[]> {
    const peopleCntForTables = peopleCnt <= 2 ? [1, 2] : [3, 4];
    return await this.waitings.find({
      where: {
        StoreId: storeId,
        status: In([WaitingStatus.ENTERED]),
        peopleCnt: In(peopleCntForTables),
      },
      order: {
        updatedAt: 'ASC', // update 기준 오름차순 정렬
      },
    });
  }

  async getWaitingsStatusWaitingAndEntered(
    storeId: number,
    peopleCnt: number,
  ): Promise<{ Waiting: Waitings[]; Entered: Waitings[] }> {
    const peopleCntForTables = peopleCnt <= 2 ? [1, 2] : [3, 4];
    const Waiting = await this.waitings.find({
      where: {
        StoreId: storeId,
        status: In([
          WaitingStatus.WAITING,
          WaitingStatus.CALLED,
          WaitingStatus.DELAYED,
        ]),
        peopleCnt: In(peopleCntForTables),
      },
      order: {
        createdAt: 'ASC', // 생성일 기준 오름차순 정렬
      },
    });
    const Entered = await this.waitings.find({
      where: {
        StoreId: storeId,
        status: In([WaitingStatus.ENTERED]),
        peopleCnt: In(peopleCntForTables),
      },
      order: {
        updatedAt: 'ASC', // update 기준 오름차순 정렬
      },
    });
    return { Waiting, Entered };
  }

  //테이블 수 조회
  async getTableTotalCnt(storeId: number, peopleCnt: number): Promise<number> {
    const stores = await this.waitings.findOne({
      where: { store: { storeId: storeId } },
      relations: ['store'],
    });
    return peopleCnt <= 2
      ? stores.store.tableForTwo
      : stores.store.tableForFour;
  }
}
