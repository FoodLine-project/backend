import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Reviews } from './reviews.entity';
import { ReviewDto } from './dto';
import { GetUser, Public } from '../auth/common/decorators';
import { Users } from '../auth/users.entity';
import { CacheInterceptor } from 'src/cache/cache.interceptor';

@Controller('stores/:storeId/reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Public()
  @Get('/')
  async getAllReviews(
    @Param('storeId', ParseIntPipe) storeId: number,
  ): Promise<Reviews[]> {
    try {
      return await this.reviewsService.getAllReviews(storeId);
    } catch (err) {
      throw err;
    }
  }

  @Post('/')
  async createReview(
    @GetUser() user: Users,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() reviewDto: ReviewDto,
  ): Promise<{ message: string; reviewId: number }> {
    try {
      const createdReview = await this.reviewsService.createReview(
        user,
        storeId,
        reviewDto,
      );
      return {
        message: '리뷰를 작성했습니다.',
        reviewId: createdReview.reviewId,
      };
    } catch (err) {
      throw err;
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
      return { message: '리뷰가 수정되었습니다.' };
    } catch (err) {
      throw err;
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
      return { message: '리뷰를 삭제했습니다.' };
    } catch (err) {
      throw err;
    }
  }

  @Public()
  @Post('/gen-random-reviews')
  async genRandomReviews() {
    try {
      await this.reviewsService.genRandomReviews();
    } catch (err) {
      throw err;
    }
  }
}
