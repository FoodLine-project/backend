import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Reviews } from './reviews.entity';
import { ReviewDto } from './dto';
import { GetUser, Public } from 'src/auth/common/decorators';
import { Users } from 'src/auth/users.entity';

@Controller('stores/:storeId/reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Public()
  @Get('/')
  getAllReviews(
    @Param('storeId', ParseIntPipe) storeId: number,
  ): Promise<Reviews[]> {
    return this.reviewsService.getAllReviews(storeId);
  }

  @Post('/')
  async createReview(
    @GetUser() user: Users,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body()
    reviewDto: ReviewDto,
  ): Promise<{ message: string }> {
    return await this.reviewsService
      .createReview(user, storeId, reviewDto)
      .then(() => {
        return { message: '리뷰를 작성했습니다.' };
      });
  }

  @Patch('/:reviewId')
  async updateReview(
    @GetUser() user: Users,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Body() reviewDto: ReviewDto,
  ): Promise<{ message: string }> {
    return await this.reviewsService
      .updateReview(user, storeId, reviewId, reviewDto)
      .then(() => {
        return { message: '리뷰가 수정되었습니다.' };
      });
  }

  @Delete('/:reviewId')
  async deleteReview(
    @GetUser() user: Users,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('reviewId', ParseIntPipe) reviewId: number,
  ): Promise<{ message: string }> {
    return await this.reviewsService
      .deleteReview(user, storeId, reviewId)
      .then(() => {
        return { message: '리뷰를 삭제했습니다.' };
      });
  }
}
