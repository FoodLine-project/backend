import { Module } from '@nestjs/common';
import { WaitingsController } from './waitings.controller';
import { WaitingsService } from './waitings.service';

@Module({
  controllers: [WaitingsController],
  providers: [WaitingsService],
})
export class WaitingsModule {}
