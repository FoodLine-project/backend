import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { WaitingsService } from './waitings.service';
import { Users } from '../auth/users.entity';
import { WaitingStatus } from './waitingStatus.enum';
import { GetUser, Public } from '../auth/common/decorators';
import { WaitingStatusValidationPipe } from './pipes/waiting-status-validation.pipe';
import { Cron } from '@nestjs/schedule';
import { Waitings } from './waitings.entity';

@Controller('stores/:storeId/waitings')
export class WaitingsController {
  constructor(private waitingsService: WaitingsService) {}

  // 웨이팅 팀 수 조회 ( for user )
  @Public()
  @Get('/')
  async getCurrentWaitingsCnt(
    @Param('storeId', ParseIntPipe) storeId: number,
  ): Promise<{ teams: number; message: string }> {
    const waitingCnt = await this.waitingsService.getCurrentWaitingsCnt(
      storeId,
    );
    return { teams: waitingCnt, message: `${waitingCnt}팀이 대기중입니다` };
  }

  // 웨이팅 리스트 조회 ( for admin )
  @Get('/list')
  async getWaitingList(
    @Param('storeId', ParseIntPipe) storeId: number,
    @GetUser() user: Users,
  ): Promise<Waitings[]> {
    return await this.waitingsService.getWaitingList(storeId, user);
  }

  // 웨이팅 신청 ( for user )
  @Post('/')
  async postWaitings(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body('peopleCnt', ParseIntPipe) peopleCnt: number,
    @GetUser() user: Users,
  ): Promise<string> {
    return this.waitingsService
      .postWaitings(storeId, peopleCnt, user)
      .then(() => {
        return `${peopleCnt}명의 웨이팅을 등록하였습니다`;
      });
  }

  // 웨이팅을 등록하지 않고 바로 입장 ( for admin )
  @Post('/:userId/entered')
  async postEntered(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body('peopleCnt', ParseIntPipe) peopleCnt: number,
    @GetUser() user: Users,
  ): Promise<string> {
    return this.waitingsService
      .postEntered(storeId, userId, peopleCnt, user)
      .then(() => `${peopleCnt}명이 입장하셨습니다`);
  }

  // 웨이팅 취소 ( for user )
  @Patch('/canceled')
  async patchStatusToCanceled(
    @Param('storeId', ParseIntPipe) storeId: number,
    @GetUser() user: Users,
  ): Promise<{ message: string }> {
    return this.waitingsService
      .patchStatusToCanceled(storeId, user)
      .then(() => {
        return { message: '웨이팅을 취소하였습니다' };
      });
  }

  // 손님의 상태를 변경 ( for admin )
  @Patch('/:waitingId/')
  async patchStatusOfWaitings(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('waitingId', ParseIntPipe) waitingId: number,
    @Query('status', WaitingStatusValidationPipe) status: WaitingStatus,
    @GetUser() user: Users,
  ): Promise<{ message: string }> {
    return this.waitingsService
      .patchStatusOfWaitings(storeId, waitingId, status, user)
      .then(() => {
        if (status === 'ENTERED') return { message: '입장하였습니다' };
        else if (status === 'EXITED') return { message: '퇴장하였습니다' };
        else if (status === 'DELAYED')
          return { message: '입장을 미루셨습니다' };
      });
  }

  // DELAYED 후 10분이 지나면 NOSHOW
  @Cron('0 */10 * * * *')
  async checkAndPatchNoshow(): Promise<void> {
    this.waitingsService.checkAndPatchNoshow();
    return;
  }

  // 나의 입장 예상 시간 조회 ( for user )
  @Get('/time')
  async getWaitingTime(
    @Param('storeId', ParseIntPipe) storeId: number,
    @GetUser() user: Users,
  ): Promise<{ time: number; message: string }> {
    const time = await this.waitingsService.getWaitingTime(storeId, user);
    if (time > 0)
      return { time: time, message: `${time}뒤에 입장이 가능합니다` };
    else if (time < 0) return { time: time, message: '곧 입장이 가능합니다' };
    else return { time: 0, message: `바로 입장이 가능합니다` };
  }
}
