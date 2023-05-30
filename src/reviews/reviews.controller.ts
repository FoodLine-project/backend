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
import { ReviewDto } from './dto';
import { GetUserId, Public } from 'src/auth/common/decorators';

@Controller('stores/:storeId/reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Public()
  @Get('/')
  getAllReviews(@Param('storeId') storeId: string): Promise<Reviews[]> {
    return this.reviewsService.getAllReviews(parseInt(storeId));
  }

  @Post('/')
  createReview(
    @GetUserId() userId: number,
    @Param('storeId') storeId: string,
    @Body()
    reviewDto: ReviewDto,
  ): Promise<Reviews> {
    return this.reviewsService.createReview(
      userId,
      parseInt(storeId),
      reviewDto,
    );
  }

  @Patch('/:reviewId')
  updateReview(
    @GetUserId() userId: number,
    @Param('storeId') storeId: string,
    @Param('reviewId') reviewId: string,
    @Body() reviewDto: ReviewDto,
  ): Promise<Reviews> {
    return this.reviewsService.updateReview(
      userId,
      parseInt(storeId),
      parseInt(reviewId),
      reviewDto,
    );
  }

  @Delete('/:reviewId')
  deleteReview(
    @GetUserId() userId: number,
    @Param('storeId') storeId: string,
    @Param('reviewId') reviewId: string,
  ): Promise<void> {
    return this.reviewsService.deleteReview(
      userId,
      parseInt(storeId),
      parseInt(reviewId),
    );
  }
}
