import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReviewsRepository } from './reviews.repository';
import { ReviewDto } from './dto';
import { Reviews } from './reviews.entity';
import { UsersRepository } from 'src/auth/users.repository';
import { StoresRepository } from 'src/stores/stores.repository';

@Injectable()
export class ReviewsService {
  constructor(
    private reviewsRepository: ReviewsRepository,
    private usersRepository: UsersRepository,
    private storesRepository: StoresRepository,
  ) {}

  async getAllReviews(storeId: number): Promise<Reviews[]> {
    return await this.reviewsRepository.findAllReviews(storeId);
  }

  async createReview(
    userId: number,
    storeId: number,
    reviewDto: ReviewDto,
  ): Promise<Reviews> {
    const user = await this.usersRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException(
        `User with userId" ${userId}" does not exist`,
      );
    }

    const store = await this.storesRepository.findStoreById(storeId);
    if (!store) {
      throw new NotFoundException(
        `Store with storeId "${storeId}" does not exist`,
      );
    }

    if (user.isAdmin && user.StoreId === store.storeId) {
      throw new ForbiddenException(`Admin user cannot write a review`);
    }

    return await this.reviewsRepository.createReview(
      user.userId,
      store.storeId,
      reviewDto,
    );
  }

  async updateReview(
    userId: number,
    storeId: number,
    reviewId: number,
    reviewDto: ReviewDto,
  ): Promise<Reviews> {
    const user = await this.usersRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException(
        `User with userId" ${userId}" does not exist`,
      );
    }

    const store = await this.storesRepository.findStoreById(storeId);
    if (!store) {
      throw new NotFoundException(
        `Store with storeId "${storeId}" does not exist`,
      );
    }

    const review = await this.reviewsRepository.findReviewById(reviewId);
    if (!review) {
      throw new NotFoundException(
        `Review with reviewId "${reviewId}" does not exist`,
      );
    }

    if (review.UserId !== user.userId) {
      throw new ForbiddenException(`User does not have access to this review`);
    }

    return await this.reviewsRepository.updateReview(review, reviewDto);
  }

  async deleteReview(
    userId: number,
    storeId: number,
    reviewId: number,
  ): Promise<void> {
    const user = await this.usersRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException(
        `User with userId" ${userId}" does not exist`,
      );
    }

    const store = await this.storesRepository.findStoreById(storeId);
    if (!store) {
      throw new NotFoundException(
        `Store with storeId "${storeId}" does not exist`,
      );
    }

    const review = await this.reviewsRepository.findReviewById(reviewId);
    if (!review) {
      throw new NotFoundException(
        `Review with reviewId "${reviewId}" does not exist`,
      );
    }

    if (review.UserId !== user.userId) {
      throw new ForbiddenException(`User does not have access to this review`);
    }

    const result = await this.reviewsRepository.deleteReview(
      user.userId,
      store.storeId,
      review.reviewId,
    );

    if (!result.affected) {
      throw new NotFoundException(`Review does not exist`);
    }
  }
}
