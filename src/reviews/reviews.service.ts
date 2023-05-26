import { Injectable, NotFoundException } from '@nestjs/common';
import { ReviewsRepository } from './reviews.repository';
import { CreateReviewDto } from './dto/create-review.dto';
import { Users } from 'src/users/user.entity';
import { Reviews } from './reviews.entity';

@Injectable()
export class ReviewsService {
  constructor(private reviewsRepository: ReviewsRepository) {}

  async getAllReviews(storeId: number): Promise<Reviews[]> {
    return await this.reviewsRepository.findAllReviews(storeId);
  }

  async createReview(
    storeId: number,
    createReviewDto: CreateReviewDto,
    user: Users,
  ): Promise<Reviews> {
    return await this.reviewsRepository.createReview(
      storeId,
      createReviewDto,
      user,
    );
  }

  async updateReview(
    storeId: number,
    reviewId: number,
    createReviewDto: CreateReviewDto,
    user: Users,
  ): Promise<Reviews> {
    return await this.reviewsRepository.updateReview(
      storeId,
      reviewId,
      createReviewDto,
      user,
    );
  }

  async deleteReview(
    storeId: number,
    reviewId: number,
    user: Users,
  ): Promise<void> {
    const result = await this.reviewsRepository.deleteReview(
      storeId,
      reviewId,
      user,
    );

    if (!result.affected) {
      throw new NotFoundException(`Can't find review with id ${reviewId}`);
    }
  }
}
