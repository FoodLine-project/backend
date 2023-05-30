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
}
