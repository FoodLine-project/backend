import { InjectRepository } from '@nestjs/typeorm';
import { Waitings } from './waitings.entity';
import { In, Repository } from 'typeorm';
import { WaitingStatus } from './waitingStatus.enum';
import { Users } from '../auth/users.entity';
export class WaitingsRepository {
  constructor(
    @InjectRepository(Waitings) private waitings: Repository<Waitings>,
  ) {}

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

    console.log(waitingCounts, '여기야');
    return waitingCounts;
  }

  async getWaitingListById(storeId: number): Promise<Waitings[]> {
    return await this.waitings.find({
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

  async getWaitingByWaitingId(waitingId: number): Promise<Waitings> {
    return await this.waitings.findOne({
      where: { waitingId },
    });
  }

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

  async patchToExited(storeId: number, waitingId: number): Promise<void> {
    const exited = await this.waitings.findOne({
      where: { waitingId },
    });
    await this.waitings
      .createQueryBuilder('waitings')
      .update(Waitings)
      .set({ status: WaitingStatus.NOTFILLED, updatedAt: () => 'updatedAt' })
      .where('waitingId = :waitingId', { waitingId })
      .setParameter('updatedAt', exited.updatedAt)
      .execute();
    if (exited.peopleCnt == 1 || exited.peopleCnt == 2) {
      const called = await this.waitings.findOne({
        where: {
          StoreId: storeId,
          status: WaitingStatus.WAITING,
          peopleCnt: In([1, 2]),
        },
      });
      if (!called) return;
      called.status = WaitingStatus.CALLED;
      await this.waitings.save(called);
      return;
    } else {
      const called = await this.waitings.findOne({
        where: {
          StoreId: storeId,
          status: WaitingStatus.WAITING,
          peopleCnt: In([3, 4]),
        },
      });
      if (!called) return;
      called.status = WaitingStatus.CALLED;
      await this.waitings.save(called);
      return;
    }
  }

  async patchToDelayed(storeId: number, waitingId: number): Promise<void> {
    const delayed = await this.waitings.findOne({
      where: { waitingId },
    });
    delayed.status = WaitingStatus.DELAYED;
    await this.waitings.save(delayed);
    if (delayed.peopleCnt == 1 || delayed.peopleCnt == 2) {
      const called = await this.waitings.findOne({
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
      await this.waitings.save(called);
      return;
    } else {
      const called = await this.waitings.findOne({
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
      await this.waitings.save(called);
      return;
    }
  }

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
    if (entered.peopleCnt == 1 || entered.peopleCnt == 2) {
      const notFilled = await this.waitings.findOne({
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
      await this.waitings.save(notFilled);
      return;
    } else {
      const notFilled = await this.waitings.findOne({
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
      await this.waitings.save(notFilled);
      return;
    }
    return;
  }

  async patchToCanceled(storeId: number, waitingId: number): Promise<void> {
    const canceled = await this.waitings.findOne({
      where: { waitingId, StoreId: storeId },
    });
    canceled.status = WaitingStatus.CANCELED;
    await this.waitings.save(canceled);
    return;
  }

  async getAllDelayed(): Promise<Waitings[]> {
    return this.waitings.find({
      where: { status: WaitingStatus.DELAYED },
    });
  }

  async saveNoshow(waitings: Waitings): Promise<void> {
    await this.waitings.save(waitings);
    return;
  }

  async getWaitingsStatusWaiting(
    storeId: number,
    peopleCnt: number,
  ): Promise<Waitings[]> {
    // <<<<<<< HEAD
    //     if (peopleCnt === 2) {
    //       return this.waitings.find({
    // =======
    if (peopleCnt == 1 || peopleCnt == 2) {
      return this.waitings.find({
        // >>>>>>> 1b4ff43efc6c59311d3d8a83d72abbae6210cb1b
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
      return this.waitings.find({
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
      return this.waitings.find({
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
      return this.waitings.find({
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
    const stores = await this.waitings.findOne({
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
