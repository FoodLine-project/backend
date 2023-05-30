import { TablesService } from './tables.service';
import { Controller } from '@nestjs/common';

@Controller('tables')
export class TablesController {
  constructor(private tablesService: TablesService) {}
}
