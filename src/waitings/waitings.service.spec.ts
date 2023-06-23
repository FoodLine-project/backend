// import { Test, TestingModule } from '@nestjs/testing';
// import { WaitingsService } from './waitings.service';
// import { WaitingsRepository } from './waitings.repository';
// import { StoresRepository } from './../stores/stores.repository';
// import { ReviewsRepository } from './../reviews/reviews.repository';
// import {
//   NotFoundException,
//   UnauthorizedException,
//   ConflictException,
//   BadRequestException,
// } from '@nestjs/common';
// import { Redis } from 'ioredis';
// import { Stores } from 'src/stores/stores.entity';
// import { Queue } from 'nest-bull';
// import { getQueueToken } from '@nestjs/bull';
// import { QueueOptions } from 'bull';

// describe('WaitingsService', () => {
//   let waitingsService: WaitingsService;
//   let redisClientMock: Redis;
//   let waitingQueue: QueueOptions;
//   let waitingsRepositoryMock: WaitingsRepository;
//   let storesRepositoryMock: StoresRepository;
//   let reviewsRepositoryMock: ReviewsRepository;

//   beforeEach(async () => {
//     // 테스트용 Redis client
//     const redisClientMock = new Redis();
//     // 모의 객체 및 테스트 환경 설정
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         WaitingsService,
//         { provide: Redis, useValue: redisClientMock },
//         { provide: WaitingsRepository, useValue: jest.fn() },
//         { provide: StoresRepository, useValue: jest.fn() },
//         { provide: ReviewsRepository, useValue: jest.fn() },
//         {
//           provide: getQueueToken('waitingQueue'),
//           useValue: {
//             add: jest.fn(),
//             process: jest.fn(),
//           },
//         },
//       ],
//     }).compile();

//     waitingsService = module.get<WaitingsService>(WaitingsService);
//     waitingQueue = module.get<QueueOptions>(getQueueToken('waitingQueue'));
//     waitingsRepositoryMock = module.get<WaitingsRepository>(WaitingsRepository);
//     storesRepositoryMock = module.get<StoresRepository>(StoresRepository);
//     reviewsRepositoryMock = module.get<ReviewsRepository>(ReviewsRepository);
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   describe('getCurrentWaitingsCnt', () => {
//     it('should return the current waitings count for a valid store', async () => {
//       const storeId = 1;
//       const expectedCount = 3;
//       const store = new Stores();
//       store.storeId = storeId;
//       jest
//         .spyOn(storesRepositoryMock, 'findStoreById')
//         .mockResolvedValueOnce(store);

//       jest
//         .spyOn(redisClientMock, 'hget')
//         .mockResolvedValueOnce(String(expectedCount));

//       const result = await waitingsService.getCurrentWaitingsCnt(storeId);

//       expect(storesRepositoryMock.findStoreById).toBeCalledWith(storeId);
//       expect(redisClientMock.hget).toBeCalledWith(
//         `store:${storeId}`,
//         'currentWaitingCnt',
//       );
//       expect(result).toBe(expectedCount);
//     });

//     it('should throw NotFoundException for an invalid store', async () => {
//       const storeId = 1;
//       jest
//         .spyOn(storesRepositoryMock, 'findStoreById')
//         .mockResolvedValueOnce(undefined);

//       await expect(
//         waitingsService.getCurrentWaitingsCnt(storeId),
//       ).rejects.toThrowError(NotFoundException);
//       expect(storesRepositoryMock.findStoreById).toBeCalledWith(storeId);
//     });
//   });

//   describe('getWaitingList', () => {
//     it('should return the waiting list for a valid store and user', async () => {
//       const storeId = 1;
//       const userId = 1;
//       const user = { StoreId: storeId };
//       const expectedWaitings = [
//         { id: 1, storeId, userId },
//         { id: 2, storeId, userId },
//       ];
//       jest
//         .spyOn(storesRepositoryMock, 'findStoreById')
//         .mockResolvedValueOnce({ id: storeId });

//       jest
//         .spyOn(waitingsRepositoryMock, 'getWaitingListById')
//         .mockResolvedValueOnce(expectedWaitings);

//       const result = await waitingsService.getWaitingList(storeId, user);

//       expect(storesRepositoryMock.findStoreById).toBeCalledWith(storeId);
//       expect(waitingsRepositoryMock.getWaitingListById).toBeCalledWith(storeId);
//       expect(result).toBe(expectedWaitings);
//     });

//     it('should throw UnauthorizedException for a user not associated with the store', async () => {
//       const storeId = 1;
//       const userId = 2;
//       const user = { StoreId: storeId };
//       jest
//         .spyOn(storesRepositoryMock, 'findStoreById')
//         .mockResolvedValueOnce({ id: storeId });

//       await expect(
//         waitingsService.getWaitingList(storeId, user),
//       ).rejects.toThrowError(UnauthorizedException);
//       expect(storesRepositoryMock.findStoreById).toBeCalledWith(storeId);
//     });

//     it('should throw NotFoundException for an invalid store', async () => {
//       const storeId = 1;
//       const userId = 1;
//       const user = { StoreId: storeId };
//       jest
//         .spyOn(storesRepository, 'findStoreById')
//         .mockResolvedValueOnce(undefined);

//       await expect(
//         waitingsService.getWaitingList(storeId, user),
//       ).rejects.toThrowError(NotFoundException);
//       expect(storesRepositoryMock.findStoreById).toBeCalledWith(storeId);
//     });
//   });

//   describe('addUserToWaitingList', () => {
//     it('should add a user to the waiting list for a valid store', async () => {
//       const storeId = 1;
//       const userId = 1;
//       const expectedWaitings = [
//         { id: 1, storeId, userId },
//         { id: 2, storeId, userId },
//       ];
//       jest
//         .spyOn(storesRepositoryMock, 'findStoreById')
//         .mockResolvedValueOnce({ id: storeId });

//       jest
//         .spyOn(waitingsRepositoryMock, 'addUserToWaitingList')
//         .mockResolvedValueOnce(expectedWaitings);

//       const result = await waitingsService.addUserToWaitingList(
//         storeId,
//         userId,
//       );

//       expect(storesRepositoryMock.findStoreById).toBeCalledWith(storeId);
//       expect(waitingsRepositoryMock.addUserToWaitingList).toBeCalledWith(
//         storeId,
//         userId,
//       );
//       expect(result).toBe(expectedWaitings);
//     });

//     it('should throw ConflictException when user is already in the waiting list for the store', async () => {
//       const storeId = 1;
//       const userId = 1;
//       jest
//         .spyOn(storesRepositoryMock, 'findStoreById')
//         .mockResolvedValueOnce({ id: storeId });

//       jest
//         .spyOn(waitingsRepositoryMock, 'addUserToWaitingList')
//         .mockRejectedValueOnce(new ConflictException());

//       await expect(
//         waitingsService.addUserToWaitingList(storeId, userId),
//       ).rejects.toThrowError(ConflictException);
//       expect(storesRepositoryMock.findStoreById).toBeCalledWith(storeId);
//       expect(waitingsRepositoryMock.addUserToWaitingList).toBeCalledWith(
//         storeId,
//         userId,
//       );
//     });

//     it('should throw NotFoundException for an invalid store', async () => {
//       const storeId = 1;
//       const userId = 1;
//       jest
//         .spyOn(storesRepositoryMock, 'findStoreById')
//         .mockResolvedValueOnce(undefined);

//       await expect(
//         waitingsService.addUserToWaitingList(storeId, userId),
//       ).rejects.toThrowError(NotFoundException);
//       expect(storesRepository.findStoreById).toBeCalledWith(storeId);
//     });
//   });

//   describe('removeUserFromWaitingList', () => {
//     it('should remove a user from the waiting list for a valid store', async () => {
//       const storeId = 1;
//       const userId = 1;
//       const expectedWaitings = [
//         { id: 1, storeId, userId },
//         { id: 2, storeId, userId },
//       ];
//       jest
//         .spyOn(storesRepository, 'findStoreById')
//         .mockResolvedValueOnce({ id: storeId });

//       jest
//         .spyOn(waitingsRepository, 'removeUserFromWaitingList')
//         .mockResolvedValueOnce(expectedWaitings);

//       const result = await waitingsService.removeUserFromWaitingList(
//         storeId,
//         userId,
//       );

//       expect(storesRepository.findStoreById).toBeCalledWith(storeId);
//       expect(waitingsRepository.removeUserFromWaitingList).toBeCalledWith(
//         storeId,
//         userId,
//       );
//       expect(result).toBe(expectedWaitings);
//     });

//     it('should throw NotFoundException when user is not in the waiting list for the store', async () => {
//       const storeId = 1;
//       const userId = 1;
//       jest
//         .spyOn(storesRepository, 'findStoreById')
//         .mockResolvedValueOnce({ id: storeId });

//       jest
//         .spyOn(waitingsRepository, 'removeUserFromWaitingList')
//         .mockRejectedValueOnce(new NotFoundException());

//       await expect(
//         waitingsService.removeUserFromWaitingList(storeId, userId),
//       ).rejects.toThrowError(NotFoundException);
//       expect(storesRepository.findStoreById).toBeCalledWith(storeId);
//       expect(waitingsRepository.removeUserFromWaitingList).toBeCalledWith(
//         storeId,
//         userId,
//       );
//     });

//     it('should throw NotFoundException for an invalid store', async () => {
//       const storeId = 1;
//       const userId = 1;
//       jest
//         .spyOn(storesRepository, 'findStoreById')
//         .mockResolvedValueOnce(undefined);

//       await expect(
//         waitingsService.removeUserFromWaitingList(storeId, userId),
//       ).rejects.toThrowError(NotFoundException);
//       expect(storesRepository.findStoreById).toBeCalledWith(storeId);
//     });
//   });

//   describe('updateWaitingStatus', () => {
//     it('should update the waiting status for a valid store and user', async () => {
//       const storeId = 1;
//       const userId = 1;
//       const status = 'completed';
//       const expectedWaitings = [
//         { id: 1, storeId, userId, status },
//         { id: 2, storeId, userId, status },
//       ];
//       jest
//         .spyOn(storesRepository, 'findStoreById')
//         .mockResolvedValueOnce({ id: storeId });

//       jest
//         .spyOn(waitingsRepository, 'updateWaitingStatus')
//         .mockResolvedValueOnce(expectedWaitings);

//       const result = await waitingsService.updateWaitingStatus(
//         storeId,
//         userId,
//         status,
//       );

//       expect(storesRepository.findStoreById).toBeCalledWith(storeId);
//       expect(waitingsRepository.updateWaitingStatus).toBeCalledWith(
//         storeId,
//         userId,
//         status,
//       );
//       expect(result).toBe(expectedWaitings);
//     });

//     it('should throw NotFoundException for an invalid store', async () => {
//       const storeId = 1;
//       const userId = 1;
//       const status = 'completed';
//       jest
//         .spyOn(storesRepository, 'findStoreById')
//         .mockResolvedValueOnce(undefined);

//       await expect(
//         waitingsService.updateWaitingStatus(storeId, userId, status),
//       ).rejects.toThrowError(NotFoundException);
//       expect(storesRepository.findStoreById).toBeCalledWith(storeId);
//     });
//   });

//   describe('getAverageWaitTime', () => {
//     it('should return the average wait time for a valid store', async () => {
//       const storeId = 1;
//       const expectedAverageWaitTime = 10;
//       jest
//         .spyOn(storesRepository, 'findStoreById')
//         .mockResolvedValueOnce({ id: storeId });

//       jest
//         .spyOn(reviewsRepository, 'getAverageWaitTimeByStoreId')
//         .mockResolvedValueOnce(expectedAverageWaitTime);

//       const result = await waitingsService.getAverageWaitTime(storeId);

//       expect(storesRepository.findStoreById).toBeCalledWith(storeId);
//       expect(reviewsRepository.getAverageWaitTimeByStoreId).toBeCalledWith(
//         storeId,
//       );
//       expect(result).toBe(expectedAverageWaitTime);
//     });

//     it('should throw BadRequestException for a store without any reviews', async () => {
//       const storeId = 1;
//       jest
//         .spyOn(storesRepository, 'findStoreById')
//         .mockResolvedValueOnce({ id: storeId });

//       jest
//         .spyOn(reviewsRepository, 'getAverageWaitTimeByStoreId')
//         .mockResolvedValueOnce(null);

//       await expect(
//         waitingsService.getAverageWaitTime(storeId),
//       ).rejects.toThrowError(BadRequestException);
//       expect(storesRepository.findStoreById).toBeCalledWith(storeId);
//       expect(reviewsRepository.getAverageWaitTimeByStoreId).toBeCalledWith(
//         storeId,
//       );
//     });

//     it('should throw NotFoundException for an invalid store', async () => {
//       const storeId = 1;
//       jest
//         .spyOn(storesRepository, 'findStoreById')
//         .mockResolvedValueOnce(undefined);

//       await expect(
//         waitingsService.getAverageWaitTime(storeId),
//       ).rejects.toThrowError(NotFoundException);
//       expect(storesRepository.findStoreById).toBeCalledWith(storeId);
//     });
//   });

//   describe('increaseCurrentWaitingsCnt', () => {
//     it('should increase the current waitings count for a valid store', async () => {
//       const storeId = 1;
//       const expectedCount = 5;
//       jest
//         .spyOn(storesRepository, 'findStoreById')
//         .mockResolvedValueOnce({ id: storeId });

//       jest
//         .spyOn(waitingsService.redisClient, 'hincrby')
//         .mockResolvedValueOnce(expectedCount);

//       await waitingsService.increaseCurrentWaitingsCnt(storeId);

//       expect(storesRepository.findStoreById).toBeCalledWith(storeId);
//       expect(waitingsService.redisClient.hincrby).toBeCalledWith(
//         `store:${storeId}`,
//         'currentWaitingCnt',
//         1,
//       );
//     });

//     it('should throw NotFoundException for an invalid store', async () => {
//       const storeId = 1;
//       jest
//         .spyOn(storesRepository, 'findStoreById')
//         .mockResolvedValueOnce(undefined);

//       await expect(
//         waitingsService.increaseCurrentWaitingsCnt(storeId),
//       ).rejects.toThrowError(NotFoundException);
//       expect(storesRepository.findStoreById).toBeCalledWith(storeId);
//     });
//   });

//   describe('decreaseCurrentWaitingsCnt', () => {
//     it('should decrease the current waitings count for a valid store', async () => {
//       const storeId = 1;
//       const expectedCount = 3;
//       jest
//         .spyOn(storesRepository, 'findStoreById')
//         .mockResolvedValueOnce({ id: storeId });

//       jest
//         .spyOn(waitingsService.redisClient, 'hincrby')
//         .mockResolvedValueOnce(expectedCount);

//       await waitingsService.decreaseCurrentWaitingsCnt(storeId);

//       expect(storesRepository.findStoreById).toBeCalledWith(storeId);
//       expect(waitingsService.redisClient.hincrby).toBeCalledWith(
//         `store:${storeId}`,
//         'currentWaitingCnt',
//         -1,
//       );
//     });

//     it('should throw NotFoundException for an invalid store', async () => {
//       const storeId = 1;
//       jest
//         .spyOn(storesRepository, 'findStoreById')
//         .mockResolvedValueOnce(undefined);

//       await expect(
//         waitingsService.decreaseCurrentWaitingsCnt(storeId),
//       ).rejects.toThrowError(NotFoundException);
//       expect(storesRepository.findStoreById).toBeCalledWith(storeId);
//     });
//   });
// });
