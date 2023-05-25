import { DataSource, DeleteResult, Repository } from 'typeorm';
import { Reviews } from './reviews.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { Users } from 'src/users/user.entity';
import { NotFoundException } from '@nestjs/common';

export class ReviewsRepository extends Repository<Reviews> {
  constructor(@InjectRepository(Reviews) private dataSource: DataSource) {
    super(Reviews, dataSource.manager);
  }

  async findAllReviews(storeId: number): Promise<Reviews[]> {
    return await this.find({ where: { StoreId: storeId } });
  }

  async createReview(
    storeId: number,
    createReviewDto: CreateReviewDto,
    user: Users,
  ): Promise<Reviews> {
    const { review, rating } = createReviewDto;

    const newReview = this.create({
      StoreId: storeId,
      UserId: user.userId,
      review,
      rating,
    });

    await this.save(newReview);
    return newReview;
  }

  async updateReview(
    storeId: number,
    reviewId: number,
    createReviewDto: CreateReviewDto,
    user: Users,
  ): Promise<Reviews> {
    const { review, rating } = createReviewDto;

    const updateReview = await this.findOne({
      where: { reviewId, StoreId: storeId, UserId: user.userId },
    });

    if (!updateReview) {
      throw new NotFoundException(`Can't find review with id ${reviewId}`);
    }

    updateReview.review = review;
    updateReview.rating = rating;

    await this.save(updateReview);
    return updateReview;
  }

  async deleteReview(
    storeId: number,
    reviewId: number,
    user: Users,
  ): Promise<DeleteResult> {
    return await this.delete({
      reviewId,
      StoreId: storeId,
      UserId: user.userId,
    });
  }
}
