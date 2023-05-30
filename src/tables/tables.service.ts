import { TablesRepository } from './tables.repository';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class TablesService {
  constructor(private tablesRepository: TablesRepository) {}

  async createTable(storeId: number): Promise<void> {
    const existsTable = await this.tablesRepository.findTableById(storeId);
    if (!existsTable) {
      throw new NotFoundException('이미 테이블이 존재합니다');
    }

    await this.tablesRepository.createTable(storeId);
  }
}
