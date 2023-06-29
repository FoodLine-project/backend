import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReviewsRepository } from './reviews.repository';
import { ReviewDto } from './dto';
import { Reviews } from './reviews.entity';
import { StoresRepository } from '../stores/stores.repository';
import { Users } from '../auth/users.entity';

@Injectable()
export class ReviewsService {
  constructor(
    private reviewsRepository: ReviewsRepository,
    private storesRepository: StoresRepository,
  ) {}

  hideNickname(nickname: string): string {
    if (nickname.length <= 4) {
      return nickname;
    }

    const firstTwo = nickname.slice(0, 2);
    const lastTwo = nickname.slice(-2);
    const middle = '*'.repeat(4);

    return firstTwo + middle + lastTwo;
  }

  async getAllReviews(storeId: number): Promise<ReviewDto[]> {
    const reviews = await this.reviewsRepository.findAllReviews(storeId);
    const result = reviews.map((review) => ({
      reviewId: review.reviewId,
      UserId: review.UserId,
      nickname: this.hideNickname(review.user.nickname),
      StoreId: review.StoreId,
      review: review.review,
      rating: review.rating,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    }));
    return result;
  }

  async createReview(
    user: Users,
    storeId: number,
    reviewDto: ReviewDto,
  ): Promise<Reviews> {
    const store = await this.storesRepository.findStoreById(storeId);
    if (!store) {
      throw new NotFoundException('존재하지 않는 음식점입니다.');
    }

    if (user.isAdmin && user.StoreId === store.storeId) {
      throw new ForbiddenException(
        '관리자는 자신의 음식점에 리뷰를 남길 수 없습니다.',
      );
    }

    const review = await this.reviewsRepository.createReview(
      user.userId,
      store.storeId,
      reviewDto,
    );

    return review;
  }

  async updateReview(
    user: Users,
    storeId: number,
    reviewId: number,
    reviewDto: ReviewDto,
  ): Promise<void> {
    const store = await this.storesRepository.findStoreById(storeId);
    if (!store) {
      throw new NotFoundException('존재하지 않는 음식점입니다.');
    }

    const review = await this.reviewsRepository.findReviewById(reviewId);
    if (!review) {
      throw new NotFoundException('존재하지 않는 리뷰입니다.');
    }

    if (review.UserId !== user.userId) {
      throw new ForbiddenException('리뷰 수정 권한이 존재하지 않습니다.');
    }

    await this.reviewsRepository.updateReview(review, reviewDto);
  }

  async deleteReview(
    user: Users,
    storeId: number,
    reviewId: number,
  ): Promise<void> {
    const store = await this.storesRepository.findStoreById(storeId);
    if (!store) {
      throw new NotFoundException('존재하지 않는 음식점입니다.');
    }

    const review = await this.reviewsRepository.findReviewById(reviewId);
    if (!review) {
      throw new NotFoundException('존재하지 않는 리뷰입니다.');
    }

    if (review.UserId !== user.userId) {
      throw new ForbiddenException('리뷰 삭제 권한이 존재하지 않습니다.');
    }

    const result = await this.reviewsRepository.deleteReview(
      user.userId,
      store.storeId,
      review.reviewId,
    );

    if (!result.affected) {
      throw new NotFoundException('존재하지 않는 리뷰입니다.');
    }
  }

  async genRandomReviews() {
    const reviewCount = 5000000;
    const storeCount = 693430;
    const userCount = 1193430;

    await this.reviewsRepository.genRandomReviews(
      reviewCount,
      storeCount,
      userCount,
    );
  }
}
