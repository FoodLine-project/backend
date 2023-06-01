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
import { Users } from 'src/auth/users.entity';
import { WaitingStatus } from './waitingStatus.enum';
import { GetUser } from 'src/auth/common/decorators';
import { WaitingStatusValidationPipe } from './pipes/waiting-status-validation.pipe';
import { Cron } from '@nestjs/schedule';
import { Waitings } from './waitings.entity';

@Controller('stores')
export class WaitingsController {
  constructor(private waitingsService: WaitingsService) {}

  // @Post('/:storeId/waitings/queue')
  // async addMessage(
  //   @Param('storeId', ParseIntPipe) storeId: number,
  //   @Body('peopleCnt') peopleCnt: number,
  //   @GetUser() user: Users,
  // ): Promise<string> {
  //   return this.waitingsService
  //     .addMessageQueue(storeId, peopleCnt, user)
  //     .then(() => `${peopleCnt}명의 웨이팅을 등록하였습니다`);
  // }

  // 웨이팅 시간 조회
  @Get('/:storeId/waitings')
  async getCurrentWaitingsCnt(
    @Param('storeId', ParseIntPipe) storeId: number,
  ): Promise<{ teams: number; message: string }> {
    const waitingCnt = await this.waitingsService.getCurrentWaitingsCnt(
      storeId,
    );
    return { teams: waitingCnt, message: `${waitingCnt}팀이 대기중입니다` };
  }

  @Get('/:storeId/waitings/list')
  async getWaitingList(
    @Param('storeId', ParseIntPipe) storeId: number,
    @GetUser() user: Users,
  ): Promise<Waitings[]> {
    return await this.waitingsService.getWaitingList(storeId, user);
  }

  @Post('/:storeId/waitings')
  async postWaitings(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body('peopleCnt') peopleCnt: number,
    @GetUser() user: Users,
  ): Promise<string> {
    return this.waitingsService
      .postWaitings(storeId, peopleCnt, user)
      .then(() => `${peopleCnt}명의 웨이팅을 등록하였습니다`);
  }

  @Post('/:storeId/entered')
  postEntered(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body('peopleCnt') peopleCnt: number,
    @GetUser() user: Users,
  ): Promise<string> {
    return this.waitingsService
      .postEntered(storeId, peopleCnt, user)
      .then(() => `${peopleCnt}명이 입장하셨습니다`);
  }

  @Patch('/:storeId/waitings/:waitingId/')
  patchStatusOfWaitings(
    @Param('storeId') storeId: number,
    @Param('waitingId') waitingId: number,
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

  @Patch('/:storeId/waitings/:waitingId/canceled')
  patchStatusToCanceled(
    @Param('storeId') storeId: number,
    @Param('waitingId') waitingId: number,
    @GetUser() user: Users,
  ): Promise<{ message: string }> {
    return this.waitingsService
      .patchStatusToCanceled(storeId, waitingId, user)
      .then(() => {
        return { message: '웨이팅을 취소하였습니다' };
      });
  }

  @Cron('0 */10 * * * *')
  // @Cron('0 */1 * * * *')
  async checkAndPatchNoshow(): Promise<void> {
    this.waitingsService.checkAndPatchNoshow();
    return;
  }

  @Get('/:storeId/waitings/:waitingId/time')
  async getWaitingTime(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('waitingId', ParseIntPipe) waitingId: number,
    @GetUser() user: Users,
  ): Promise<{ time: number; message: string }> {
    const time = await this.waitingsService.getWaitingTime(
      storeId,
      waitingId,
      user,
    );
    if (time > 0)
      return { time: time, message: `${time}뒤에 입장이 가능합니다` };
    else if (time < 0) return { time: time, message: '곧 입장이 가능합니다' };
    else return { time: 0, message: `바로 입장이 가능합니다` };
  }
}
