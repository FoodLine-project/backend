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
} from '@nestjs/common';
import { WaitingsService } from './waitings.service';
import { Users } from 'src/users/users.entity';
import { WaitingStatus } from './waitingStatus.enum';
import { AuthGuard } from '@nestjs/passport';

@Controller('stores')
export class WaitingsController {
  constructor(private waitingsService: WaitingsService) {}

  @Get('/:storeId/waitings')
  getCurrentWaitingsCnt(@Param('storeId') storeId): Promise<number> {
    return this.waitingsService.getCurrentWaitingsCnt(storeId);
  }

  @UseGuards(AuthGuard())
  @Post('/:storeId/waitings')
  postWaitings(
    @Param('storeId') storeId,
    @Body('peopleCnt') peopleCnt: number,
    @GetUser() user: Users,
  ): string {
    this.waitingsService.postWaitings(storeId, peopleCnt, user);
    return `${peopleCnt}명의 웨이팅을 등록하였습니다`;
  }

  @UseGuards(AuthGuard())
  @Patch('/:storeId/waitings/:waitingId/')
  patchStatusOfWaitings(
    @Param('storeId') storeId: number,
    @Param('waitingId') waitingId: number,
    @Query('status') status: WaitingStatus,
    @GetUser() user: Users,
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

  @UseGuards(AuthGuard())
  @Get('/:storeId/waitings/:waitingId/time')
  getWaitingTime(
    @Param('storeId') storeId: number,
    @Param('waitingId') waitingId: number,
    @GetUser() user: Users,
  ): Promise<number> {
    const time = this.waitingsService.getWaitingTime(storeId, waitingId, user);
    return time;
  }
}
