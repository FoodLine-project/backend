import { DeleteResult, Repository } from 'typeorm';
import { Reviews } from './reviews.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ReviewDto } from './dto';

export class ReviewsRepository {
  constructor(
    @InjectRepository(Reviews) private reviews: Repository<Reviews>,
  ) {}

  async findReviewById(reviewId: number): Promise<Reviews> {
    return await this.reviews.findOne({ where: { reviewId } });
  }

  async findAllReviews(StoreId: number): Promise<Reviews[]> {
    return await this.reviews.find({
      where: { StoreId },
      order: {
        // reviewId: 'ASC',
        createdAt: 'ASC',
        updatedAt: 'ASC',
      },
    });
  }

  async createReview(
    UserId: number,
    StoreId: number,
    reviewDto: ReviewDto,
  ): Promise<Reviews> {
    const { review, rating } = reviewDto;

    const newReview = this.reviews.create({
      StoreId,
      UserId,
      review,
      rating,
    });

    await this.reviews.save(newReview);
    return newReview;
  }

  async updateReview(
    updatedReview: Reviews,
    reviewDto: ReviewDto,
  ): Promise<void> {
    const { review, rating } = reviewDto;

    updatedReview.review = review;
    updatedReview.rating = rating;

    await this.reviews.save(updatedReview);
  }

  async deleteReview(
    UserId: number,
    StoreId: number,
    reviewId: number,
  ): Promise<DeleteResult> {
    return await this.reviews.delete({
      UserId,
      StoreId,
      reviewId,
    });
  }

  async getAverageRating(storeId: number): Promise<number> {
    const reviews = await this.findAllReviews(storeId);

    if (reviews.length === 0) {
      //없을때 0으로
      return 0;
    }

    const ratings = reviews.map((review) => {
      return review.rating;
    });

    const average = ratings.reduce((a, b) => a + b) / ratings.length;

    return parseFloat(average.toPrecision(2));
  }

  async genRandomReviews(
    reviewCount: number,
    storeCount: number,
    userCount: number,
  ) {
    const ratings: number[] = [1, 2, 3, 4, 5];
    const reviews: string[] = [
      '최악이에요',
      '별로에요',
      '무난해요',
      '맛있어요',
      '최고에요',
    ];

    for (let i = 287551; i < reviewCount; i++) {
      const index = Math.floor(Math.random() * 5);
      const ranUserId = Math.floor(Math.random() * userCount) + 1;
      const ranStoreId = Math.floor(Math.random() * storeCount) + 1;
      await this.createReview(ranUserId, ranStoreId, {
        rating: ratings[index],
        review: reviews[index],
      });
      console.log(`${i + 1}번째 리뷰를 생성했습니다.`);
    }
  }
}
