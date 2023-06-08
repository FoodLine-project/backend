import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Waitings } from './waitings.entity';
import { DataSource, In, Repository } from 'typeorm';
import { WaitingStatus } from './waitingStatus.enum';
import { Users } from 'src/auth/users.entity';
export class WaitingsRepository extends Repository<Waitings> {
  constructor(@InjectRepository(Waitings) private dataSource: DataSource) {
    super(Waitings, dataSource.manager);
  }

  async getCurrentWaitingCnt(storeId: number): Promise<number> {
    const waitingStatuses = [
      WaitingStatus.WAITING,
      WaitingStatus.CALLED,
      WaitingStatus.DELAYED,
    ];
    const waitingCounts = await this.createQueryBuilder('waitings')
      .leftJoin('waitings.store', 'store')
      .where('store.storeId = :storeId', { storeId })
      .andWhere('waitings.status IN (:...statuses)', {
        statuses: waitingStatuses,
      })
      .getCount();
    console.log(waitingCounts, '여기야');
    return waitingCounts;
  }

  async getWaitingListById(storeId: number): Promise<Waitings[]> {
    return await this.find({
      where: {
        StoreId: storeId,
        status: In([
          WaitingStatus.WAITING,
          WaitingStatus.CALLED,
          WaitingStatus.DELAYED,
        ]),
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async getWaitingByUser(user: Users): Promise<Waitings> {
    return await this.findOne({
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

  async getWaitingByUserId(userId: number): Promise<Waitings> {
    return await this.findOne({
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

  async getWaitingByWaitingId(waitingId: number): Promise<Waitings> {
    return await this.findOne({
      where: { waitingId },
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
    userId: number,
    peopleCnt: number,
  ): Promise<void> {
    const waiting = this.create({
      StoreId: storeId,
      UserId: userId,
      peopleCnt,
      status: WaitingStatus.ENTERED,
    });
    await this.save(waiting);
    return;
  }

  async patchToExited(storeId: number, waitingId: number): Promise<void> {
    const exited = await this.findOne({
      where: { waitingId },
    });
    // exited.status = WaitingStatus.NOTFILLED;
    // await this.save(exited);
    await this.createQueryBuilder('waitings')
      .update(Waitings)
      .set({ status: WaitingStatus.NOTFILLED, updatedAt: () => 'updatedAt' })
      .where('waitingId = :waitingId', { waitingId })
      .setParameter('updatedAt', exited.updatedAt)
      .execute();
    if (exited.peopleCnt == 1 || exited.peopleCnt == 2) {
      const called = await this.findOne({
        where: {
          StoreId: storeId,
          status: WaitingStatus.WAITING,
          peopleCnt: In([1, 2]),
        },
      });
      if (!called) return;
      called.status = WaitingStatus.CALLED;
      await this.save(called);
      return;
    } else {
      const called = await this.findOne({
        where: {
          StoreId: storeId,
          status: WaitingStatus.WAITING,
          peopleCnt: In([3, 4]),
        },
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
    if (delayed.peopleCnt == 1 || delayed.peopleCnt == 2) {
      const called = await this.findOne({
        where: {
          StoreId: storeId,
          status: WaitingStatus.WAITING,
          peopleCnt: In([1, 2]),
        },
        order: {
          createdAt: 'ASC',
        },
      });
      if (!called) return;
      called.status = WaitingStatus.CALLED;
      await this.save(called);
      return;
    } else {
      const called = await this.findOne({
        where: {
          StoreId: storeId,
          status: WaitingStatus.WAITING,
          peopleCnt: In([3, 4]),
        },
        order: {
          createdAt: 'ASC',
        },
      });
      if (!called) return;
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
    if (entered.peopleCnt == 1 || entered.peopleCnt == 2) {
      const notFilled = await this.findOne({
        where: {
          StoreId: storeId,
          status: WaitingStatus.NOTFILLED,
          peopleCnt: In([1, 2]),
        },
        order: {
          updatedAt: 'ASC',
        },
      });
      console.log(notFilled);
      if (!notFilled) return;
      notFilled.status = WaitingStatus.EXITED;
      await this.save(notFilled);
      return;
    } else {
      const notFilled = await this.findOne({
        where: {
          StoreId: storeId,
          status: WaitingStatus.NOTFILLED,
          peopleCnt: In([3, 4]),
        },
        order: {
          updatedAt: 'ASC',
        },
      });
      console.log(notFilled);
      if (!notFilled) return;
      notFilled.status = WaitingStatus.EXITED;
      await this.save(notFilled);
      return;
    }
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

  async saveNoshow(waitings: Waitings): Promise<void> {
    await this.save(waitings);
    return;
  }

  async getWaitingsStatusWaiting(
    storeId: number,
    peopleCnt: number,
  ): Promise<Waitings[]> {
    if (peopleCnt == 1 || peopleCnt == 2) {
      return this.find({
        where: {
          StoreId: storeId,
          status: In([
            WaitingStatus.WAITING,
            WaitingStatus.CALLED,
            WaitingStatus.DELAYED,
          ]),
          peopleCnt: In([1, 2]),
        },
        order: {
          createdAt: 'ASC', // 생성일 기준 오름차순 정렬
        },
      });
    } else {
      return this.find({
        where: {
          StoreId: storeId,
          status: In([
            WaitingStatus.WAITING,
            WaitingStatus.CALLED,
            WaitingStatus.DELAYED,
          ]),
          peopleCnt: In([3, 4]),
        },
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
      return this.find({
        where: {
          StoreId: storeId,
          status: In([WaitingStatus.ENTERED, WaitingStatus.NOTFILLED]),
          peopleCnt: In([1, 2]),
        },
        order: {
          updatedAt: 'ASC', // update 기준 오름차순 정렬
        },
      });
    } else {
      return this.find({
        where: {
          StoreId: storeId,
          status: In([WaitingStatus.ENTERED, WaitingStatus.NOTFILLED]),
          peopleCnt: In([3, 4]),
        },
        order: {
          updatedAt: 'ASC', // update 기준 오름차순 정렬
        },
      });
    }
  }

  async getTableTotalCnt(storeId: number, peopleCnt: number): Promise<number> {
    const stores = await this.findOne({
      where: { store: { storeId: storeId } },
      relations: ['store'],
    });
    if (peopleCnt === 1 || peopleCnt === 0) {
      return stores.store.tableForTwo;
    } else {
      return stores.store.tableForFour;
    }
  }
}
