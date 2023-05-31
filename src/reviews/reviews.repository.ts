import { DataSource, DeleteResult, Repository } from 'typeorm';
import { Reviews } from './reviews.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ReviewDto } from './dto';

export class ReviewsRepository extends Repository<Reviews> {
  constructor(@InjectRepository(Reviews) private dataSource: DataSource) {
    super(Reviews, dataSource.manager);
  }

  async findReviewById(reviewId: number): Promise<Reviews> {
    return await this.findOne({ where: { reviewId } });
  }

  async findAllReviews(StoreId: number): Promise<Reviews[]> {
    return await this.find({ where: { StoreId } });
  }

  async createReview(
    UserId: number,
    StoreId: number,
    reviewDto: ReviewDto,
  ): Promise<void> {
    const { review, rating } = reviewDto;

    const newReview = this.create({
      StoreId,
      UserId,
      review,
      rating,
    });

    await this.save(newReview);
  }

  async updateReview(
    updatedReview: Reviews,
    reviewDto: ReviewDto,
  ): Promise<void> {
    const { review, rating } = reviewDto;

    updatedReview.review = review;
    updatedReview.rating = rating;

    await this.save(updatedReview);
  }

  async deleteReview(
    UserId: number,
    StoreId: number,
    reviewId: number,
  ): Promise<DeleteResult> {
    return await this.delete({
      UserId,
      StoreId,
      reviewId,
    });
  }

  async getAverageRating(storeId: number): Promise<number> {
    const reviews = await this.findAllReviews(storeId);

    const ratings = reviews.map((review) => {
      return review.rating;
    });

    const average = ratings.reduce((a, b) => a + b) / ratings.length;

    return parseFloat(average.toPrecision(2));
  }
}
