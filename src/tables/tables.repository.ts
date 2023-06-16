import { Repository } from 'typeorm';
import { Tables } from './tables.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Stores } from '../stores/stores.entity';
export class TablesRepository {
  constructor(@InjectRepository(Tables) private tables: Repository<Tables>) {}

  async findTableById(storeId: number): Promise<Tables> {
    return await this.tables.findOne({ where: { StoreId: storeId } });
  }

  async createTable(stores: Stores): Promise<void> {
    const table = this.tables.create({
      StoreId: stores.storeId,
      availableTableForFour: stores.tableForFour,
      availableTableForTwo: stores.tableForTwo,
    });
    await this.tables.save(table);
    return;
  }

  async incrementTables(storeId: number, peopleCnt: number): Promise<void> {
    if (peopleCnt === 1 || peopleCnt === 2) {
      this.tables.increment({ StoreId: storeId }, 'availableTableForTwo', 1);
    } else {
      this.tables.increment({ StoreId: storeId }, 'availableTableForFour', 1);
    }
  }

  async decrementTables(storeId: number, peopleCnt: number): Promise<void> {
    if (peopleCnt === 1 || peopleCnt === 2) {
      this.tables.decrement({ StoreId: storeId }, 'availableTableForTwo', 1);
    } else {
      this.tables.decrement({ StoreId: storeId }, 'availableTableForFour', 1);
    }
  }
}
