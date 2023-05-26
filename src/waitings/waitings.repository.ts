import { InjectRepository } from '@nestjs/typeorm';
import { Waitings } from './waitings.entity';
import { DataSource, Repository } from 'typeorm';
import { WaitingStatus } from './waitingStatus.enum';
import { Users } from 'src/users/users.entity';

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

  // user:Users
  async postWaitings(
    storeId: number,
    peopleCnt: number,
    user: Users,
  ): Promise<void> {
    const waiting = this.create({
      StoreId: storeId,
      UserId: user.userId,
      peopleCnt,
    });
    await this.save(waiting);
    return;
  }

  async patchStatusOfWaitings(
    storeId: number,
    waitingId: number,
    status: WaitingStatus,
    user: Users,
  ): Promise<void> {
    const waiting = await this.findOne({
      where: { waitingId, StoreId: storeId, UserId: user.userId },
    });

    waiting.status = status;
    await this.save(waiting);
    return;
  }

  async getWaitingsStatusEntered(storeId: number): Promise<Waitings[]> {
    return this.find({
      where: { StoreId: storeId, status: WaitingStatus.ENTERED },
    });
  }
  async getWaitingsStatusWaiting(storeId: number): Promise<Waitings[]> {
    return this.find({
      where: { StoreId: storeId, status: WaitingStatus.WAITING },
    });
  }

  async getTableTotalCnt(storeId: number): Promise<number> {
    const stores = await this.findOne({
      where: { store: { storeId: storeId } },
      relations: ['store'],
    });
    return stores.store.tableForTwo + stores.store.tableForFour;
  }
}
