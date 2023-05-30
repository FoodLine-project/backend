import { TablesRepository } from './tables.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TablesService {
  constructor(private tablesRepository: TablesRepository) {}
}
