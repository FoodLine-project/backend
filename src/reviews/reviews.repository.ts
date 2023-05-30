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

  async findAllReviews(storeId: number): Promise<Reviews[]> {
    return await this.find({ where: { StoreId: storeId } });
  }

  async createReview(
    UserId: number,
    StoreId: number,
    reviewDto: ReviewDto,
  ): Promise<Reviews> {
    const { review, rating } = reviewDto;

    const newReview = this.create({
      StoreId,
      UserId,
      review,
      rating,
    });

    await this.save(newReview);
    return newReview;
  }

  async updateReview(
    updatedReview: Reviews,
    reviewDto: ReviewDto,
  ): Promise<Reviews> {
    const { review, rating } = reviewDto;

    updatedReview.review = review;
    updatedReview.rating = rating;

    await this.save(updatedReview);

    return updatedReview;
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
}
