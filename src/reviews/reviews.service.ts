import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ReviewsRepository } from './reviews.repository';
import { ReviewDto } from './dto';
import { Reviews } from './reviews.entity';
import { StoresRepository } from '../stores/stores.repository';
import { Users } from '../auth/users.entity';

@Injectable()
export class ReviewsService {
  private logger = new Logger('ReviewsService');

  constructor(
    private reviewsRepository: ReviewsRepository,
    private storesRepository: StoresRepository,
  ) {}

  async getAllReviews(storeId: number): Promise<Reviews[]> {
    try {
      return await this.reviewsRepository.findAllReviews(storeId);
    } catch (error) {
      // this.logger.error(
      //   `리뷰 목록 조회 실패 - storeId: ${storeId}, Error: ${error}`,
      // );
      throw error;
    }
  }

  async createReview(
    user: Users,
    storeId: number,
    reviewDto: ReviewDto,
  ): Promise<void> {
    try {
      const store = await this.storesRepository.findStoreById(storeId);
      if (!store) {
        throw new NotFoundException(`존재하지 않는 음식점입니다.`);
      }

      if (user.isAdmin && user.StoreId === store.storeId) {
        throw new ForbiddenException(
          `관리자는 자신의 음식점에 리뷰를 남길 수 없습니다.`,
        );
      }

      await this.reviewsRepository.createReview(
        user.userId,
        store.storeId,
        reviewDto,
      );

      // this.logger.verbose(`리뷰 작성 성공 - storeId: ${storeId}`);
    } catch (error) {
      // this.logger.error(
      //   `리뷰 작성 실패 - storeId: ${storeId}, Error: ${error}`,
      // );
      throw error;
    }
  }

  async updateReview(
    user: Users,
    storeId: number,
    reviewId: number,
    reviewDto: ReviewDto,
  ): Promise<void> {
    try {
      const store = await this.storesRepository.findStoreById(storeId);
      if (!store) {
        throw new NotFoundException(`존재하지 않는 음식점입니다.`);
      }

      const review = await this.reviewsRepository.findReviewById(reviewId);
      if (!review) {
        throw new NotFoundException(`존재하지 않는 리뷰입니다.`);
      }

      if (review.UserId !== user.userId) {
        throw new ForbiddenException(`리뷰 수정 권한이 존재하지 않습니다.`);
      }

      await this.reviewsRepository.updateReview(review, reviewDto);

      // this.logger.verbose(
      //   `리뷰 수정 성공 - storeId: ${storeId}, reviewId: ${reviewId}`,
      // );
    } catch (error) {
      // this.logger.error(
      //   `리뷰 수정 실패 - storeId: ${storeId}, reviewId: ${reviewId}, Error: ${error}`,
      // );
      throw error;
    }
  }

  async deleteReview(
    user: Users,
    storeId: number,
    reviewId: number,
  ): Promise<void> {
    try {
      const store = await this.storesRepository.findStoreById(storeId);
      if (!store) {
        throw new NotFoundException(`존재하지 않는 음식점입니다.`);
      }

      const review = await this.reviewsRepository.findReviewById(reviewId);
      if (!review) {
        throw new NotFoundException(`존재하지 않는 리뷰입니다.`);
      }

      if (review.UserId !== user.userId) {
        throw new ForbiddenException(`리뷰 삭제 권한이 존재하지 않습니다.`);
      }

      const result = await this.reviewsRepository.deleteReview(
        user.userId,
        store.storeId,
        review.reviewId,
      );

      if (!result.affected) {
        throw new NotFoundException(`존재하지 않는 리뷰입니다.`);
      }

      // this.logger.verbose(
      //   `리뷰 삭제 성공 - storeId: ${storeId}, reviewId: ${reviewId}`,
      // );
    } catch (error) {
      // this.logger.error(
      //   `리뷰 삭제 실패 - storeId: ${storeId}, reviewId: ${reviewId}, Error: ${error}`,
      // );
      throw error;
    }
  }
}
