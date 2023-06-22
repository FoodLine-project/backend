import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { Stores } from './stores.entity';
import { StoresRepository } from './stores.repository';
import axios from 'axios';
jest.mock('axios');

describe('StoresRepository', () => {
  let repository: StoresRepository;
  let storesMockRepository: Repository<Stores>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        StoresRepository,
        {
          provide: getRepositoryToken(Stores),
          useClass: Repository,
        },
      ],
    }).compile();

    //repository 변수에 StoresRepository클래스의 인스턴스가 할당되어 사용할 수 있게 됌,
    //repository를 사용하여 StoryRepository의 메소드를 호출하고 test할 수 있음
    repository = module.get<StoresRepository>(StoresRepository);
    //storeMockRepository= getRepositoryToken(Stores)로 생성된 MockRepository 객체
    storesMockRepository = module.get<Repository<Stores>>(
      getRepositoryToken(Stores),
    );
  });

  //사용자 위치 기반 반경 1km내의 식당 조회를 위해 전체 데이터 조회
  describe('findAll', () => {
    it('findAll', async () => {
      const storesData: Stores[] = [
        // Mock stores data
      ];

      jest.spyOn(storesMockRepository, 'find').mockResolvedValue(storesData);

      const result = await repository.findAll();

      expect(result).toEqual(storesData);
      expect(storesMockRepository.find).toHaveBeenCalled();
    });
  });

  //1차 햄버거 조회
  //   describe('searchStores', () => {
  //     it('1차 햄버거 조회', async () => {
  //       const keyword = 'keyword';
  //       const sort = 'ASC';
  //       const column = 'column';
  //       const searchStoresData: Stores[] = [
  //         // Mock search stores data
  //       ];

  //       jest
  //         .spyOn(storesMockRepository, 'find')
  //         .mockResolvedValue(searchStoresData);

  //       const result = await repository.searchStores(keyword, sort, column);

  //       expect(result).toEqual(searchStoresData);
  //       expect(storesMockRepository.find).toHaveBeenCalled();
  //     });
  //   });

  //cycleTime 가져오기
  describe('getCycleTimeByStoreId', () => {
    it('가게의 cycletime 조회', async () => {
      const storeId = 1;
      const cycleTime = 10;
      const store = new Stores();
      store.storeId = storeId;
      store.storeName = '';

      store.category = '';
      store.maxWaitingCnt = 0;

      store.lat = 0;
      store.lon = 0;
      //address는 new, old 다 가져와야할 듯?
      //   store.address = '';
      store.oldAddress = '';
      store.cycleTime = cycleTime;
      store.tableForTwo = 0;
      store.tableForFour = 0;
      store.coordinates = null;
      store.createdAt = new Date();
      store.updatedAt = new Date();
      store.waitings = [];
      store.reviews = [];
      store.tables = null;
      store.user = null;

      jest.spyOn(storesMockRepository, 'findOne').mockResolvedValue(store);

      const result = await repository.getCycleTimeByStoreId(storeId);

      expect(result).toEqual(cycleTime);
      expect(storesMockRepository.findOne).toHaveBeenCalledWith({
        where: { storeId },
      });
    });
  });

  //한개 찾기
  describe('findStoreById', () => {
    it('한개 찾기', async () => {
      const storeId = 1;
      const store = new Stores();
      store.storeId = storeId;
      store.storeName = '';
      store.category = '';
      store.maxWaitingCnt = 0;
      store.lat = 0;
      store.lon = 0;
      //   store.address = '';
      store.oldAddress = '';
      store.cycleTime = 0;
      store.tableForTwo = 0;
      store.tableForFour = 0;
      store.coordinates = null;
      store.createdAt = new Date();
      store.updatedAt = new Date();
      store.waitings = [];
      store.reviews = [];
      store.tables = null;
      store.user = null;

      jest.spyOn(storesMockRepository, 'findOne').mockResolvedValue(store);
      const result = await repository.findStoreById(storeId);

      expect(result).toEqual(store);
      expect(storesMockRepository.findOne).toHaveBeenCalledWith({
        where: { storeId },
      });
    });
  });

  //상세조회
  describe('getOneStore', () => {
    it('리뷰와 함께 상세조회', async () => {
      const storeId = 1;
      const store = new Stores();
      store.storeId = storeId;
      store.reviews = [];

      jest.spyOn(storesMockRepository, 'findOne').mockResolvedValue(store);

      const result = await repository.getOneStore(storeId);

      expect(result).toEqual(store);
      expect(storesMockRepository.findOne).toHaveBeenCalledWith({
        where: { storeId },
        relations: ['reviews'],
      });
    });
  });

  //csv파일 업로드
  //   describe('processCSVFile', () => {
  //     it('CSV 파일을 POSTGRESQL에 저장', async () => {
  //       const rows = [
  //         {
  //           사업장명: 'Store 1',
  //           위생업태명: 'Category 1',
  //           도로명전체주소: 'Address 1',
  //           소재지전체주소: 'Old Address 1',
  //         },
  //         {
  //           사업장명: 'Store 2',
  //           위생업태명: 'Category 2',
  //           도로명전체주소: 'Address 2',
  //           소재지전체주소: 'Old Address 2',
  //         },
  //       ];

  //       jest
  //         .spyOn(storesMockRepository, 'create')
  //         .mockImplementation((entity) => entity);
  //       jest
  //         .spyOn(storesMockRepository, 'save')
  //         .mockResolvedValue(Promise.resolve<DeepPartial<Stores> & Stores>({}));

  //       await repository.processCSVFile(rows);

  //       expect(storesMockRepository.create).toHaveBeenCalledTimes(2);
  //       expect(storesMockRepository.save).toHaveBeenCalledTimes(2);
  //     });
  //   });

  //카카오톡에 주소 넣고 해당 좌표 가져오기
  // describe('getCoordinate', () => {
  //   it('카카오톡에서 좌표 가져오기', async () => {
  //     const address = 'Sample Address';
  //     const expectedCoordinates = ['37.1234', '127.5678'];

  //     // 모의 응답 설정
  //     const response = {
  //       data: {
  //         documents: [
  //           {
  //             address: {
  //               x: expectedCoordinates[1],
  //               y: expectedCoordinates[0],
  //             },
  //           },
  //         ],
  //       },
  //     };
  //     axios.get.mockResolvedValue(response);

  //     const coordinates = await repository.getCoordinate(address);

  //     // 기대 결과 검증
  //     expect(coordinates).toEqual(expectedCoordinates);
  //     expect(axios.get).toHaveBeenCalledTimes(1);
  //     expect(axios.get).toHaveBeenCalledWith(
  //       expect.stringContaining(encodeURIComponent(address)),
  //       {
  //         headers: {
  //           Authorization: expect.stringContaining(
  //             process.env.KAKAO_REST_API_KEY,
  //           ),
  //         },
  //       },
  //     );
  //   });

  //   it('should return null when no coordinates are found', async () => {
  //     const address = 'Sample Address';

  //     // 모의 응답 설정
  //     const response = {
  //       data: {
  //         documents: [],
  //       },
  //     };
  //     axios.get.mockResolvedValue(response);

  //     // 메서드 호출
  //     const coordinates = await repository.getCoordinate(address);

  //     // 기대 결과 검증
  //     expect(coordinates).toBeNull();
  //   });

  //   it('should throw an error when there is an error fetching coordinates from Kakao API', async () => {
  //     const address = 'Sample Address';
  //     const errorMessage = 'Error fetching coordinates';

  //     // 모의 응답 설정
  //     axios.get.mockRejectedValue(new Error(errorMessage));

  //     // 메서드 호출 및 오류 검증
  //     await expect(repository.getCoordinate(address)).rejects.toThrow(
  //       `Error fetching coordinates from Kakao API: ${errorMessage}`,
  //     );
  //   });
  // });

  //카톡에서 추출한 좌표를 postgresql에 저장
  describe('updateCoord', () => {
    it('카톡에서 추출한 좌표를 postgresql에 저장', async () => {
      const storeId = 1;
      const lat = 10;
      const lon = 20;

      const updateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };

      jest
        .spyOn(storesMockRepository, 'update')
        .mockResolvedValue(updateResult);

      await repository.updateCoord(lat, lon, storeId);

      expect(storesMockRepository.update).toHaveBeenCalledWith(storeId, {
        lat,
        lon,
      });
    });
  });
});
