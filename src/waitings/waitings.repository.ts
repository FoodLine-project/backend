import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Waitings } from './waitings.entity';
import { DataSource, Repository } from 'typeorm';
import { WaitingStatus } from './waitingStatus.enum';
import { Users } from 'src/auth/users.entity';

export class WaitingsRepository extends Repository<Waitings> {
  constructor(@InjectRepository(Waitings) private dataSource: DataSource) {
    super(Waitings, dataSource.manager);
  }

  async getCurrentWaitingCnt(storeId: number): Promise<number> {
    const waitingCounts = await this.createQueryBuilder('waitings')
      .leftJoin('waitings.store', 'store')
      .where('store.storeId = :storeId', { storeId })
      .andWhere('waitings.status = :status', { status: WaitingStatus.WAITING })
      .getCount();
    return waitingCounts;
  }

  async getWaitingListById(storeId: number): Promise<Waitings[]> {
    return await this.find({
      where: {
        StoreId: storeId,
        status:
          WaitingStatus.WAITING ||
          WaitingStatus.CALLED ||
          WaitingStatus.DELAYED,
      },
    });
  }

  async getWaitingByUser(user: Users): Promise<Waitings> {
    return await this.findOne({
      where: {
        UserId: user.userId,
        status:
          WaitingStatus.WAITING ||
          WaitingStatus.CALLED ||
          WaitingStatus.DELAYED,
      },
    });
  }

  async postWaitings(
    storeId: number,
    peopleCnt: number,
    user: Users,
  ): Promise<Waitings> {
    const waiting = this.create({
      StoreId: storeId,
      UserId: user.userId,
      peopleCnt,
    });
    return await this.save(waiting);
  }

  async postEntered(
    storeId: number,
    peopleCnt: number,
    user: Users,
  ): Promise<void> {
    const waiting = this.create({
      StoreId: storeId,
      UserId: user.userId,
      peopleCnt,
      status: WaitingStatus.ENTERED,
    });
    await this.save(waiting);
    return;
  }

  async getWaitingById(waitingId: number): Promise<Waitings> {
    return await this.findOne({
      where: { waitingId },
    });
  }

  async patchToExited(storeId: number, waitingId: number): Promise<void> {
    const exited = await this.findOne({
      where: { waitingId },
    });
    exited.status = WaitingStatus.EXITED;
    await this.save(exited);
    if (exited.peopleCnt === 1 || 2) {
      const peopleCntOption = [1, 2];
      const called = await this.findOne({
        where: peopleCntOption.map((peopleCnt) => ({
          StoreId: storeId,
          status: WaitingStatus.WAITING,
          peopleCnt,
        })),
      });
      if (!called) return;
      called.status = WaitingStatus.CALLED;
      await this.save(called);
      return;
    } else {
      const peopleCntOption = [3, 4];
      const called = await this.findOne({
        where: peopleCntOption.map((peopleCnt) => ({
          StoreId: storeId,
          status: WaitingStatus.WAITING,
          peopleCnt,
        })),
      });
      if (!called) return;
      called.status = WaitingStatus.CALLED;
      await this.save(called);
      return;
    }
  }

  async patchToDelayed(storeId: number, waitingId: number): Promise<void> {
    const delayed = await this.findOne({
      where: { waitingId },
    });
    delayed.status = WaitingStatus.DELAYED;
    await this.save(delayed);
    if (delayed.peopleCnt === 1 || 2) {
      const peopleCntOption = [1, 2];
      const called = await this.findOne({
        where: peopleCntOption.map((peopleCnt) => ({
          StoreId: storeId,
          status: WaitingStatus.WAITING,
          peopleCnt,
        })),
      });
      called.status = WaitingStatus.CALLED;
      await this.save(called);
      return;
    } else {
      const peopleCntOption = [3, 4];
      const called = await this.findOne({
        where: peopleCntOption.map((peopleCnt) => ({
          StoreId: storeId,
          status: WaitingStatus.WAITING,
          peopleCnt,
        })),
      });
      called.status = WaitingStatus.CALLED;
      await this.save(called);
      return;
    }
  }

  async patchToEntered(
    storeId: number,
    waitingId: number,
    status: WaitingStatus,
  ): Promise<void> {
    const entered = await this.findOne({
      where: { waitingId },
    });
    entered.status = status;
    await this.save(entered);
    return;
  }

  async patchToCanceled(storeId: number, waitingId: number): Promise<void> {
    const canceled = await this.findOne({
      where: { waitingId, StoreId: storeId },
    });
    canceled.status = WaitingStatus.CANCELED;
    await this.save(canceled);
    return;
  }

  async getAllDelayed(): Promise<Waitings[]> {
    return this.find({
      where: { status: WaitingStatus.DELAYED },
    });
  }

  async getWaitingsStatusWaiting(
    storeId: number,
    peopleCnt: number,
  ): Promise<Waitings[]> {
    if (peopleCnt === 2) {
      const peopleCntOption = [1, 2];
      return this.find({
        where: peopleCntOption.map((peopleCnt) => ({
          StoreId: storeId,
          status:
            WaitingStatus.WAITING ||
            WaitingStatus.CALLED ||
            WaitingStatus.DELAYED,
          peopleCnt,
        })),
        order: {
          createdAt: 'ASC', // 생성일 기준 오름차순 정렬
        },
      });
    } else {
      const peopleCntOption = [3, 4];
      return this.find({
        where: peopleCntOption.map((peopleCnt) => ({
          StoreId: storeId,
          status:
            WaitingStatus.WAITING ||
            WaitingStatus.CALLED ||
            WaitingStatus.DELAYED,
          peopleCnt,
        })),
        order: {
          createdAt: 'ASC', // 생성일 기준 오름차순 정렬
        },
      });
    }
  }

  async getWaitingsStatusEntered(
    storeId: number,
    peopleCnt: number,
  ): Promise<Waitings[]> {
    if (peopleCnt === 2) {
      const peopleCntOption = [1, 2];
      return this.find({
        where: peopleCntOption.map((peopleCnt) => ({
          StoreId: storeId,
          status: WaitingStatus.ENTERED,
          peopleCnt,
        })),
        order: {
          createdAt: 'ASC', // 생성일 기준 오름차순 정렬
        },
      });
    } else {
      const peopleCntOption = [3, 4];
      return this.find({
        where: peopleCntOption.map((peopleCnt) => ({
          StoreId: storeId,
          status: WaitingStatus.ENTERED,
          peopleCnt,
        })),
        order: {
          createdAt: 'ASC', // 생성일 기준 오름차순 정렬
        },
      });
    }
  }

  async getTableTotalCnt(
    storeId: number,
    getPeopleCnt: number,
  ): Promise<number> {
    const stores = await this.findOne({
      where: { store: { storeId: storeId } },
      relations: ['store'],
    });
    if (getPeopleCnt === 2) {
      return stores.store.tableForTwo;
    } else {
      return stores.store.tableForFour;
    }
  }

  async getPeopleCnt(
    storeId: number,
    waitingId: number,
    user: Users,
  ): Promise<number> {
    const findWaitingById = await this.findOne({
      where: { waitingId, StoreId: storeId, UserId: user.userId },
    });
    if (!findWaitingById) {
      throw new NotFoundException(`Can't find waiting with id`);
    } else if (findWaitingById.status !== 'WAITING') {
      throw new NotFoundException('이미 입장한 상태입니다.');
    }
    if (findWaitingById.peopleCnt > 2) return 4;
    else return 2;
  }
}
