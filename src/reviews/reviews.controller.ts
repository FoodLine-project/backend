import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Reviews } from './reviews.entity';
import { Users } from 'src/auth/users.entity';
import { CreateReviewDto } from './dto';
import { GetCurrentUser } from 'src/auth/common/decorators';

@Controller('stores/:storeId/reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get('/')
  getAllReviews(@Param('storeId') storeId: number): Promise<Reviews[]> {
    return this.reviewsService.getAllReviews(storeId);
  }

  @Post('/')
  createReview(
    @Param('storeId') storeId: number,
    @GetCurrentUser() user: Users,
    // @GetUser() user: Users,
    @Body()
    createReviewDto: CreateReviewDto,
  ): Promise<Reviews> {
    return this.reviewsService.createReview(storeId, createReviewDto, user);
  }

  @Patch('/:reviewId')
  updateReview(
    @Param('storeId') storeId: number,
    @Param('reviewId') reviewId: number,
    @GetCurrentUser() user: Users,
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<Reviews> {
    return this.reviewsService.updateReview(
      storeId,
      reviewId,
      createReviewDto,
      user,
    );
  }

  @Delete('/:reviewId')
  deleteReview(
    @Param('storeId') storeId: number,
    @Param('reviewId') reviewId: number,
    @GetCurrentUser() user: Users,
  ): Promise<void> {
    return this.reviewsService.deleteReview(storeId, reviewId, user);
  }
}
