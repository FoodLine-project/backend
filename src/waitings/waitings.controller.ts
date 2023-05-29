import { GetUser } from 'src/users/get-user.decorator';
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
import { Users } from 'src/users/users.entity';
import { WaitingStatus } from './waitingStatus.enum';
import { AuthGuard } from '@nestjs/passport';
import { WaitingStatusValidationPipe } from './pipes/waiting-status-validation.pipe';
import { Cron } from '@nestjs/schedule';

@Controller('stores')
export class WaitingsController {
  constructor(private waitingsService: WaitingsService) {}

  @Get('/:storeId/waitings')
  async getCurrentWaitingsCnt(
    @Param('storeId', ParseIntPipe) storeId,
  ): Promise<{ teams: number; message: string }> {
    const waitingCnt = await this.waitingsService.getCurrentWaitingsCnt(
      storeId,
    );
    return { teams: waitingCnt, message: `${waitingCnt}팀이 대기중입니다` };
  }

  @UseGuards(AuthGuard())
  @Post('/:storeId/waitings')
  postWaitings(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body('peopleCnt', ValidationPipe) peopleCnt: number,
    @GetUser() user: Users,
  ): string {
    this.waitingsService.postWaitings(storeId, peopleCnt, user);
    return `${peopleCnt}명의 웨이팅을 등록하였습니다`;
  }

  @UseGuards(AuthGuard())
  @Post('/:storeId/entered')
  postEntered(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body('peopleCnt', ValidationPipe) peopleCnt: number,
    @GetUser() user: Users,
  ): string {
    this.waitingsService.postEntered(storeId, peopleCnt, user);
    return `${peopleCnt}명이 입장하셨습니다`;
  }

  @UseGuards(AuthGuard())
  @Patch('/:storeId/waitings/:waitingId/')
  patchStatusOfWaitings(
    @Param('storeId', ValidationPipe) storeId: number,
    @Param('waitingId', ValidationPipe) waitingId: number,
    @Query('status', WaitingStatusValidationPipe) status: WaitingStatus,
  ): { message: string } {
    this.waitingsService.patchStatusOfWaitings(storeId, waitingId, status);
    if (status === 'ENTERED') return { message: '입장하였습니다' };
    else if (status === 'EXITED') return { message: '퇴장하였습니다' };
    else if (status === 'DELAYED') return { message: '입장을 미루셨습니다' };
    else return { message: '웨이팅을 취소하였습니다' };
  }

  @Cron('0 */10 * * * *')
  // @Cron('0 */1 * * * *')
  async checkAndPatchNoshow(): Promise<void> {
    this.waitingsService.checkAndPatchNoshow();
    return;
  }

  @UseGuards(AuthGuard())
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
