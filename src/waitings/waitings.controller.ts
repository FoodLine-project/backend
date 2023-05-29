import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { WaitingsService } from './waitings.service';
import { Users } from 'src/auth/users.entity';
import { WaitingStatus } from './waitingStatus.enum';
import { GetCurrentUser } from 'src/auth/common/decorators';
import { AuthGuard } from '@nestjs/passport';
import { WaitingStatusValidationPipe } from './pipes/waiting-status-validation.pipe';

@Controller('stores')
export class WaitingsController {
  constructor(private waitingsService: WaitingsService) {}

  @UseGuards(AuthGuard())
  @Get('/:storeId/waitings')
  getCurrentWaitingsCnt(
    @Param('storeId', ParseIntPipe) storeId,
  ): Promise<number> {
    return this.waitingsService.getCurrentWaitingsCnt(storeId);
  }

  @Post('/:storeId/waitings')
  postWaitings(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body('peopleCnt') peopleCnt: number,
    @GetCurrentUser() user: Users,
  ): string {
    this.waitingsService.postWaitings(storeId, peopleCnt, user);
    return `${peopleCnt}명의 웨이팅을 등록하였습니다`;
  }

  @Patch('/:storeId/waitings/:waitingId/')
  patchStatusOfWaitings(
    @Param('storeId') storeId: number,
    @Param('waitingId') waitingId: number,
    @Query('status', WaitingStatusValidationPipe) status: WaitingStatus,
    @GetCurrentUser() user: Users,
  ): { message: string } {
    this.waitingsService.patchStatusOfWaitings(
      storeId,
      waitingId,
      status,
      user,
    );
    if (status === 'ENTERED') return { message: '입장하였습니다' };
    else if (status === 'EXITED') return { message: '퇴장하였습니다' };
    else {
      message: '취소하였습니다';
    }
  }

  @Get('/:storeId/waitings/:waitingId/time')
  getWaitingTime(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('waitingId', ParseIntPipe) waitingId: number,
    @GetCurrentUser() user: Users,
  ): Promise<number> {
    const time = this.waitingsService.getWaitingTime(storeId, waitingId, user);
    return time;
  }
}
