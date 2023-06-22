import { Controller, Get } from '@nestjs/common';
import { Public } from 'src/auth/common/decorators';

@Controller('')
export class AppController {
  @Public()
  @Get('')
  async healthcheck() {
    return;
  }
}
