import { AuthGuard } from '@nestjs/passport';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Reviews } from './reviews.entity';
import { Users } from 'src/users/users.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { GetUser } from 'src/users/get-user.decorator';

@Controller('stores/:storeId/reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) { }

  @Get('/')
  getAllReviews(@Param('storeId') storeId: number): Promise<Reviews[]> {
    return this.reviewsService.getAllReviews(storeId);
  }

  @UseGuards(AuthGuard())
  @Post('/')
  @UsePipes(ValidationPipe)
  createReview(
    @Param('storeId') storeId: number,
    @GetUser() user: Users,
    @Body(ValidationPipe) createReviewDto: CreateReviewDto,
  ): Promise<Reviews> {
    return this.reviewsService.createReview(storeId, createReviewDto, user);
  }

  @UseGuards(AuthGuard())
  @Patch('/:reviewId')
  updateReview(
    @Param('storeId') storeId: number,
    @Param('reviewId') reviewId: number,
    @GetUser() user: Users,
    @Body(ValidationPipe) createReviewDto: CreateReviewDto,
  ): Promise<Reviews> {
    return this.reviewsService.updateReview(
      storeId,
      reviewId,
      createReviewDto,
      user,
    );
  }

  @UseGuards(AuthGuard())
  @Delete('/:reviewId')
  deleteReview(
    @Param('storeId') storeId: number,
    @Param('reviewId') reviewId: number,
    @GetUser() user: Users,
  ): Promise<void> {
    return this.reviewsService.deleteReview(storeId, reviewId, user);
  }
}

// @Patch, @Delete
// /api/stores/:storeId/reviews/:reviewId
