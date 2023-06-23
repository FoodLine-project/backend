// import { Test, TestingModule } from '@nestjs/testing';
// import { WaitingsController } from './waitings.controller';
// import { WaitingsService } from './waitings.service';
// import { Users } from '../auth/users.entity';
// import { WaitingStatus } from './waitingStatus.enum';
// import { Waitings } from './waitings.entity';
// import { StoresRepository } from 'src/stores/stores.repository';
// import { NotFoundException } from '@nestjs/common';
// import { Redis } from 'ioredis';
// import { WaitingsRepository } from './waitings.repository';

// class MockStoreRepository {
//   findStoreById = jest.fn().mockImplementation((storeId) => {
//     if (!storeId) {
//       throw new NotFoundException('음식점이 존재하지 않습니다');
//     }
//     return Promise.resolve();
//   });
// }

// class MockRedisClient {
//   hget = jest.fn().mockImplementation(() => {
//     return 5;
//   });
// }

// class MockWaitingRepotisory {}
// describe('WaitingsController', () => {
//   let controller: WaitingsController;
//   let service: WaitingsService;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [WaitingsController],
//       providers: [
//         WaitingsService,
//         {
//           provide: StoresRepository,
//           useClass: MockStoreRepository,
//         },
//         {
//           provide: Redis,
//           useClass: MockRedisClient,
//         },
//         {
//           provide: WaitingsRepository,
//           useClass: MockWaitingRepotisory,
//         },
//       ],
//     }).compile();

//     controller = module.get<WaitingsController>(WaitingsController);
//     service = module.get<WaitingsService>(WaitingsService);
//   });

//   describe('getCurrentWaitingsCnt', () => {
//     it('should return the current waiting count', async () => {
//       const storeId = 1;
//       const expectedResult = { teams: 5, message: '5팀이 대기중입니다' };
//       jest
//         .spyOn(service, 'getCurrentWaitingsCnt')
//         .mockResolvedValue(expectedResult.teams);

//       const result = await controller.getCurrentWaitingsCnt(storeId);

//       expect(result).toEqual(expectedResult);
//       expect(service.getCurrentWaitingsCnt).toHaveBeenCalledWith(storeId);
//     });
//   });

//   describe('getWaitingList', () => {
//     it('should return the waiting list for admin', async () => {
//       const storeId = 1;
//       const user = new Users();
//       user.userId = 1;
//       user.email = 'test01@example.com';
//       user.nickname = 'test01';
//       user.password = 'asdf1234';
//       user.phoneNumber = '010-0101-0101';
//       user.isAdmin = true;
//       user.StoreId = 1;
//       const expectedResult: Waitings[] = [];
//       jest.spyOn(service, 'getWaitingList').mockResolvedValue(expectedResult);

//       const result = await controller.getWaitingList(storeId, user);

//       expect(result).toEqual(expectedResult);
//       expect(service.getWaitingList).toHaveBeenCalledWith(storeId, user);
//     });
//   });

//   describe('postWaitings', () => {
//     it('should post a waiting for a user', async () => {
//       const storeId = 1;
//       const peopleCnt = 2;
//       const user = new Users();
//       user.userId = 1;
//       user.email = 'test01@example.com';
//       user.nickname = 'test01';
//       user.password = 'asdf1234';
//       user.phoneNumber = '010-0101-0101';
//       const expectedResult = '2명의 웨이팅을 등록하였습니다';
//       jest
//         .spyOn(service, 'postWaitings')
//         .mockResolvedValue(`${peopleCnt}명의 웨이팅을 등록하였습니다`);

//       const result = await controller.postWaitings(storeId, peopleCnt, user);

//       expect(result).toEqual(expectedResult);
//       expect(service.postWaitings).toHaveBeenCalledWith(
//         storeId,
//         peopleCnt,
//         user,
//       );
//     });
//   });

//   describe('postEntered', () => {
//     it('should allow entering without registering a waiting for admin', async () => {
//       const storeId = 1;
//       const userId = 1;
//       const peopleCnt = 2;
//       const user = new Users();
//       user.userId = 1;
//       user.email = 'test01@example.com';
//       user.nickname = 'test01';
//       user.password = 'asdf1234';
//       user.phoneNumber = '010-0101-0101';
//       user.isAdmin = true;
//       user.StoreId = 1;
//       const expectedResult = '2명이 입장하셨습니다';
//       jest
//         .spyOn(service, 'postEntered')
//         .mockResolvedValue(`${peopleCnt}명이 입장하셨습니다`);

//       const result = await controller.postEntered(
//         storeId,
//         userId,
//         peopleCnt,
//         user,
//       );

//       expect(result).toEqual(expectedResult);
//       expect(service.postEntered).toHaveBeenCalledWith(
//         storeId,
//         userId,
//         peopleCnt,
//         user,
//       );
//     });
//   });

//   describe('patchStatusToCanceled', () => {
//     it('should cancel a waiting for a user', async () => {
//       const storeId = 1;
//       const user = new Users();
//       user.userId = 1;
//       user.email = 'test01@example.com';
//       user.nickname = 'test01';
//       user.password = 'asdf1234';
//       user.phoneNumber = '010-0101-0101';
//       const expectedResult = { message: '웨이팅을 취소하였습니다' };
//       jest.spyOn(service, 'patchStatusToCanceled').mockResolvedValue();

//       const result = await controller.patchStatusToCanceled(storeId, user);

//       expect(result).toEqual(expectedResult);
//       expect(service.patchStatusToCanceled).toHaveBeenCalledWith(storeId, user);
//     });
//   });

//   describe('patchStatusOfWaitings', () => {
//     it('should change the status of a waiting for admin', async () => {
//       const storeId = 1;
//       const waitingId = 1;
//       const status: WaitingStatus = WaitingStatus.ENTERED;
//       const user = new Users();
//       user.userId = 1;
//       user.email = 'test01@example.com';
//       user.nickname = 'test01';
//       user.password = 'asdf1234';
//       user.phoneNumber = '010-0101-0101';
//       user.isAdmin = true;
//       user.StoreId = 1;
//       const expectedResult = { message: '입장하였습니다' };
//       jest.spyOn(service, 'patchStatusOfWaitings').mockResolvedValue();

//       const result = await controller.patchStatusOfWaitings(
//         storeId,
//         waitingId,
//         status,
//         user,
//       );

//       expect(result).toEqual(expectedResult);
//       expect(service.patchStatusOfWaitings).toHaveBeenCalledWith(
//         storeId,
//         waitingId,
//         status,
//         user,
//       );
//     });
//   });

//   describe('checkAndPatchNoshow', () => {
//     it('should check and patch the status to NOSHOW for delayed waitings', async () => {
//       jest.spyOn(service, 'checkAndPatchNoshow').mockResolvedValue();

//       await controller.checkAndPatchNoshow();

//       expect(service.checkAndPatchNoshow).toHaveBeenCalled();
//     });
//   });

//   describe('getWaitingTime', () => {
//     it('should return the estimated waiting time for a user', async () => {
//       const storeId = 1;
//       const user = new Users();
//       user.userId = 1;
//       user.email = 'test01@example.com';
//       user.nickname = 'test01';
//       user.password = 'asdf1234';
//       user.phoneNumber = '010-0101-0101';
//       const expectedResult = {
//         time: 10,
//         message: '10뒤에 입장이 가능합니다',
//       };
//       jest
//         .spyOn(service, 'getWaitingTime')
//         .mockResolvedValue(expectedResult.time);

//       const result = await controller.getWaitingTime(storeId, user);

//       expect(result).toEqual(expectedResult);
//       expect(service.getWaitingTime).toHaveBeenCalledWith(storeId, user);
//     });

//     it('should return a message for immediate or soon entry', async () => {
//       const storeId = 1;
//       const user = new Users();
//       user.userId = 1;
//       user.email = 'test01@example.com';
//       user.nickname = 'test01';
//       user.password = 'asdf1234';
//       user.phoneNumber = '010-0101-0101';
//       const expectedResult = { time: 0, message: '바로 입장이 가능합니다' };
//       jest
//         .spyOn(service, 'getWaitingTime')
//         .mockResolvedValue(expectedResult.time);

//       const result = await controller.getWaitingTime(storeId, user);

//       expect(result).toEqual(expectedResult);
//       expect(service.getWaitingTime).toHaveBeenCalledWith(storeId, user);
//     });
//   });
// });
