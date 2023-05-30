import { DataSource, Repository } from 'typeorm';
import { Tables } from './tables.entity';
import { InjectRepository } from '@nestjs/typeorm';
export class TablesRepository extends Repository<Tables> {
  constructor(@InjectRepository(Tables) private dataSource: DataSource) {
    super(Tables, dataSource.manager);
  }

  async findTableById(storeId: number): Promise<Tables> {
    return await this.findOne({ where: { StoreId: storeId } });
  }

  async createTable(storeId: number): Promise<void> {
    const table = await this.create({
      StoreId: storeId,
    });
    await this.save(table);
    return;
  }
}
