import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Stores } from './stores.entity';
import { StoresSearchDto } from './dto/search-stores.dto';

@Injectable()
export class StoresRepository extends Repository<Stores> {
  constructor(dataSource: DataSource) {
    super(Stores, dataSource.createEntityManager());
  }

  async searchStores(keyword: string): Promise<StoresSearchDto[]> {
    const searchStores = await this.createQueryBuilder('stores')
      .select([
        'stores.storeId',
        'stores.storeName',
        'stores.category',
        'stores.maxWaitingCnt',
      ])
      .where(
        'stores.storeName ILIKE :keyword OR stores.category ILIKE :keyword',
        { keyword: `%${keyword}%` },
      )
      .getMany();
    //ILIKE = case insensitive
    return searchStores;
  }
}
