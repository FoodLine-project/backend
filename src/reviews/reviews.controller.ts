import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Reviews } from './reviews.entity';
import { ReviewDto } from './dto';
import { GetUser, Public } from '../auth/common/decorators';
import { Users } from '../auth/users.entity';

@Controller('stores/:storeId/reviews')
export class ReviewsController {
  private logger = new Logger('ReviewsController');

  constructor(private reviewsService: ReviewsService) {}

  @Public()
  @Get('/')
  async getAllReviews(
    @Param('storeId', ParseIntPipe) storeId: number,
  ): Promise<Reviews[]> {
    try {
      return await this.reviewsService.getAllReviews(storeId);
    } catch (error) {
      // this.logger.error(
      //   `리뷰 목록 조회 실패 - storeId: ${storeId}, Error: ${error}`,
      // );
      throw error;
    }
  }

  @Post('/')
  async createReview(
    @GetUser() user: Users,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body()
    reviewDto: ReviewDto,
  ): Promise<{ message: string }> {
    try {
      await this.reviewsService.createReview(user, storeId, reviewDto);
      // this.logger.verbose(`리뷰 작성 성공 - storeId: ${storeId}`);
      return { message: '리뷰를 작성했습니다.' };
    } catch (error) {
      // this.logger.error(
      //   `리뷰 작성 실패 - storeId: ${storeId}, Error: ${error}`,
      // );
      throw error;
    }
  }

  @Patch('/:reviewId')
  async updateReview(
    @GetUser() user: Users,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Body() reviewDto: ReviewDto,
  ): Promise<{ message: string }> {
    try {
      await this.reviewsService.updateReview(
        user,
        storeId,
        reviewId,
        reviewDto,
      );
      // this.logger.verbose(
      //   `리뷰 수정 성공 - storeId: ${storeId}, reviewId: ${reviewId}`,
      // );
      return { message: '리뷰가 수정되었습니다.' };
    } catch (error) {
      // this.logger.error(
      //   `리뷰 수정 실패 - storeId: ${storeId}, reviewId: ${reviewId}, Error: ${error}`,
      // );
      throw error;
    }
  }

  @Delete('/:reviewId')
  async deleteReview(
    @GetUser() user: Users,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('reviewId', ParseIntPipe) reviewId: number,
  ): Promise<{ message: string }> {
    try {
      await this.reviewsService.deleteReview(user, storeId, reviewId);
      // this.logger.verbose(
      //   `리뷰 삭제 성공 - storeId: ${storeId}, reviewId: ${reviewId}`,
      // );
      return { message: '리뷰를 삭제했습니다.' };
    } catch (error) {
      // this.logger.error(
      //   `리뷰 삭제 실패 - storeId: ${storeId}, reviewId: ${reviewId}, Error: ${error}`,
      // );
      throw error;
    }
  }
}
