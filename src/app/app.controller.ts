import { Controller, Get } from '@nestjs/common';
import { Public } from 'src/auth/common/decorators';
import { AppService } from './app.service';

@Controller('/')
export class AppController {
  constructor(private appService: AppService) {}

  @Public()
  @Get('/')
  async healthcheck() {
    try {
      return this.appService.healthCheck();
    } catch (err) {
      throw err;
    }
  }
}
