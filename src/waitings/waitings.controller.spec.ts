import { WaitingsController } from './waitings.controller';
import { WaitingsService } from './waitings.service';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WaitingsModule } from './waitings.module';
import { AuthModule } from '../auth/auth.module';
import { UsersRepository } from '../auth/users.repository';
import { WaitingsRepository } from './waitings.repository';
import { StoresRepository } from '../stores/stores.repository';
import { TablesRepository } from '../tables/tables.repository';
import { ReviewsRepository } from '../reviews/reviews.repository';

describe('WaitingsController', () => {
  let controller: WaitingsController;
  let service: WaitingsService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [WaitingsModule],
      controllers: [WaitingsController],
      providers: [
        WaitingsService,
        WaitingsRepository,
        StoresRepository,
        TablesRepository,
        ReviewsRepository,
      ],
    }).compile();

    controller = moduleRef.get<WaitingsController>(WaitingsController);
    service = moduleRef.get<WaitingsService>(WaitingsService);
  });

  describe('getCurrentWaitingCnt', () => {
    it('should return the current waitings count for a store', async () => {
      const storeId = 1;
      const teams = 5;
      const message = `${teams}팀이 대기중입니다}`;

      jest.spyOn(service, 'getCurrentWaitingsCnt').mockResolvedValue(teams);

      const result = await controller.getCurrentWaitingsCnt(storeId);

      expect(result).toEqual({ teams, message });
      expect(service.getCurrentWaitingsCnt).toBeCalledWith(storeId);
    });

    it('should throw NotFouindException if the store does not exist', async () => {
      const storeId = 1;

      jest
        .spyOn(service, `getCurrentWaitingsCnt`)
        .mockRejectedValue(new NotFoundException());

      await expect(
        controller.getCurrentWaitingsCnt(storeId),
      ).rejects.toThrowError(NotFoundException);
      expect(service.getCurrentWaitingsCnt).toBeCalledWith(storeId);
    });
  });
});
