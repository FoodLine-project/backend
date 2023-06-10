import { DeleteResult, Repository } from 'typeorm';
import { Reviews } from './reviews.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ReviewDto } from './dto';
import { Logger } from '@nestjs/common';

export class ReviewsRepository {
  private logger = new Logger(ReviewsRepository.name);

  constructor(
    @InjectRepository(Reviews) private reviews: Repository<Reviews>,
  ) {}

  async findReviewById(reviewId: number): Promise<Reviews> {
    try {
      return await this.reviews.findOne({ where: { reviewId } });
    } catch (error) {
      // this.logger.error(
      //   `리뷰 조회 실패 - reviewId: ${reviewId}, Error: ${error}`,
      // );
      throw error;
    }
  }

  async findAllReviews(StoreId: number): Promise<Reviews[]> {
    try {
      return await this.reviews.find({ where: { StoreId } });
    } catch (error) {
      // this.logger.error(
      //   `리뷰 목록 조회 실패 - StoreId: ${StoreId}, Error: ${error}`,
      // );
      throw error;
    }
  }

  async createReview(
    UserId: number,
    StoreId: number,
    reviewDto: ReviewDto,
  ): Promise<void> {
    try {
      const { review, rating } = reviewDto;

      const newReview = this.reviews.create({
        StoreId,
        UserId,
        review,
        rating,
      });

      await this.reviews.save(newReview);

      // this.logger.verbose(
      //   `리뷰 작성 성공 - StoreId: ${StoreId}, UserId: ${UserId}`,
      // );
    } catch (error) {
      // this.logger.error(
      //   `리뷰 작성 실패 - StoreId: ${StoreId}, UserId: ${UserId}, Error: ${error}`,
      // );
      throw error;
    }
  }

  async updateReview(
    updatedReview: Reviews,
    reviewDto: ReviewDto,
  ): Promise<void> {
    try {
      const { review, rating } = reviewDto;

      updatedReview.review = review;
      updatedReview.rating = rating;

      await this.reviews.save(updatedReview);

      // this.logger.verbose(
      //   `리뷰 수정 성공 - reviewId: ${updatedReview.reviewId}`,
      // );
    } catch (error) {
      // this.logger.error(
      //   `리뷰 수정 실패 - reviewId: ${updatedReview.reviewId}, Error: ${error}`,
      // );
      throw error;
    }
  }

  async deleteReview(
    UserId: number,
    StoreId: number,
    reviewId: number,
  ): Promise<DeleteResult> {
    try {
      const result = await this.reviews.delete({
        UserId,
        StoreId,
        reviewId,
      });

      if (!result.affected) {
        // this.logger.verbose(`존재하지 않는 리뷰 - reviewId: ${reviewId}`);
      }

      // this.logger.verbose(`리뷰 삭제 성공 - reviewId: ${reviewId}`);

      return result;
    } catch (error) {
      // this.logger.error(
      //   `리뷰 삭제 실패 - reviewId: ${reviewId}, Error: ${error}`,
      // );
      throw error;
    }
  }

  async getAverageRating(storeId: number): Promise<number> {
    try {
      const reviews = await this.findAllReviews(storeId);

      const ratings = reviews.map((review) => {
        return review.rating;
      });

      const average = ratings.reduce((a, b) => a + b) / ratings.length;

      return parseFloat(average.toPrecision(2));
    } catch (error) {
      // this.logger.error(
      //   `평균 평점 계산 실패 - storeId: ${storeId}, Error: ${error}`,
      // );
      throw error;
    }
  }
}
