import { TablesService } from './tables.service';
import { Controller, Post, Body } from '@nestjs/common';

@Controller('tables')
export class TablesController {
  constructor(private tablesService: TablesService) {}
}
