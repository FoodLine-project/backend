import { DataSource, Repository } from 'typeorm';
import { Tables } from './tables.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Stores } from 'src/stores/stores.entity';
export class TablesRepository extends Repository<Tables> {
  constructor(@InjectRepository(Tables) private dataSource: DataSource) {
    super(Tables, dataSource.manager);
  }

  async findTableById(storeId: number): Promise<Tables> {
    return await this.findOne({ where: { StoreId: storeId } });
  }

  async createTable(stores: Stores): Promise<void> {
    const table = this.create({
      StoreId: stores.storeId,
      availableTableForFour: stores.tableForFour,
      availableTableForTwo: stores.tableForTwo,
    });
    await this.save(table);
    return;
  }

  async incrementTables(storeId: number, peopleCnt: number): Promise<void> {
    if (peopleCnt === 1 || 2) {
      this.increment({ StoreId: storeId }, 'availableTableForTwo', 1);
    } else {
      this.increment({ StoreId: storeId }, 'availableTableForFour', 1);
    }
  }

  async decrementTables(storeId: number, peopleCnt: number): Promise<void> {
    if (peopleCnt === 1 || 2) {
      this.decrement({ StoreId: storeId }, 'availableTableForTwo', 1);
    } else {
      this.decrement({ StoreId: storeId }, 'availableTableForFour', 1);
    }
  }
}
