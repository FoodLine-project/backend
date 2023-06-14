// import { Test, TestingModule } from '@nestjs/testing';
// import { getRepositoryToken } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Users } from './users.entity';
// import { UsersRepository } from './users.repository';
// import { SignupDto } from './dto';
// import { ConflictException } from '@nestjs/common';

// describe('UsersRepository', () => {
//   let usersRepository: UsersRepository;
//   let userRepository: Repository<Users>;
//   // Repository<Users> 인터페이스의 메서드를 전부 가지고 있는데 각 메서드는 jest.Mock 타입의 모의 함수로 구현
//   // Partial - 객체의 모든 속성을 선택적으로 만듦
//   // Record - 키와 값의 타입을 지정하여 객체 생성
//   // keyof Repository<Users> - Repository<Users> 타입의 모든 속성 이름
//   // - (Repository<Users> 인터페이스의 모든 메서드 이름을 가져옴)
//   // * Partial<Record<keyof Repository<Users>, jest.Mock>> === Repository<Users> 인터페이스의 모든 메서드에 대한 모의 함수를 가진 객체
//   let userRepositoryMock: Partial<Record<keyof Repository<Users>, jest.Mock>>;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         UsersRepository,
//         {
//           // getRepositoryToken - 주어진 엔티티에 대한 TypeORM 리포지토리 토큰을 생성함
//           // * 리포지토리 토큰???
//           //   - 특정한 타입의 리포지토리를 식별하는 데 사용됨.
//           //   - NestJS와 TypeORM을 함께 사용할 때, NestJS의 의존성 주입 시스템은 리포지토리를 주입할 때 해당 리포지토리의 타입 정보가 필요함
//           //     리포지토리 토큰은 이러한 타입 정보를 식별하는 역할을 함. 주입 시스템은 해당 타입의 리포지토리를 찾아서 주입해주는데, 이때 리포지토리 토큰을 사용하여 식별함.
//           //     일반적으로 리포지토리 토큰은 문자열 형태로 정의되며, 일반적으로 문자열 상수로 사용됨.
//           //     getRepositoryToken() 함수를 통해 엔티티의 타입 정보를 기반으로 리포지토리 토큰을 동적으로 생성 -> 주입 시스템이 올바른 타입의 리포지토리를 찾아주고 주입할 수 있음.
//           provide: getRepositoryToken(Users),
//           useValue: {
//             create: jest.fn(),
//             save: jest.fn(),
//             update: jest.fn(),
//             findOne: jest.fn(),
//           },
//         },
//       ],
//     }).compile();

//     usersRepository = module.get<UsersRepository>(UsersRepository);
//     userRepository = module.get<Repository<Users>>(getRepositoryToken(Users));
//     userRepositoryMock = userRepository as unknown as Partial<
//       Record<keyof Repository<Users>, jest.Mock>
//     >;
//   });

//   describe('createUser', () => {
//     it('should save user', async () => {
//       const signupDto: SignupDto = {
//         email: 'test@example.com',
//         nickname: 'test',
//         password: 'password',
//         confirm: 'password',
//         phoneNumber: '010-1234-5678',
//       };
//       const hashedPassword = 'hashedPassword';

//       const user = await usersRepository.createUser(signupDto, hashedPassword);

//       expect(userRepositoryMock.create).toHaveBeenCalled();
//       expect(userRepositoryMock.create).toHaveBeenCalledTimes(1);
//       expect(userRepositoryMock.create).toHaveBeenCalledWith({
//         email: signupDto.email,
//         nickname: signupDto.nickname,
//         password: hashedPassword,
//         phoneNumber: signupDto.phoneNumber,
//         isAdmin: signupDto.isAdmin,
//         StoreId: signupDto.StoreId,
//       });

//       expect(userRepositoryMock.save).toHaveBeenCalledWith(user);
//       expect(userRepositoryMock.save).toHaveBeenCalled();
//       expect(userRepositoryMock.save).toHaveBeenCalledTimes(1);
//     });

//     it('should throw ConflictException for duplicate nickname', async () => {
//       const signupDto: SignupDto = {
//         email: 'test@example.com',
//         nickname: 'test',
//         password: 'password',
//         confirm: 'password',
//         phoneNumber: '010-1234-5678',
//       };
//       const hashedPassword = 'hashedPassword';

//       // 중복된 닉네임을 가지는 예외를 발생시키기 위해, save 함수가 중복된 닉네임 에러를 던지도록 모의 함수 설정
//       userRepositoryMock.save.mockRejectedValueOnce({
//         code: '23505',
//         detail: 'nickname',
//       });

//       // ConflictException이 발생해야 함
//       const user = await expect(
//         usersRepository.createUser(signupDto, hashedPassword),
//       ).rejects.toThrow(ConflictException);

//       expect(userRepositoryMock.create).toHaveBeenCalled();
//       expect(userRepositoryMock.create).toHaveBeenCalledTimes(1);
//       expect(userRepositoryMock.create).toHaveBeenCalledWith({
//         email: signupDto.email,
//         nickname: signupDto.nickname,
//         password: hashedPassword,
//         phoneNumber: signupDto.phoneNumber,
//         isAdmin: signupDto.isAdmin,
//         StoreId: signupDto.StoreId,
//       });

//       expect(userRepositoryMock.save).toHaveBeenCalledWith(user);
//       expect(userRepositoryMock.save).toHaveBeenCalled();
//       expect(userRepositoryMock.save).toHaveBeenCalledTimes(1);
//     });

//     it('should throw ConflictException for duplicate email', async () => {
//       const signupDto: SignupDto = {
//         email: 'test@example.com',
//         nickname: 'test',
//         password: 'password',
//         confirm: 'password',
//         phoneNumber: '010-1234-5678',
//       };
//       const hashedPassword = 'hashedPassword';

//       // 중복된 닉네임을 가지는 예외를 발생시키기 위해, save 함수가 중복된 닉네임 에러를 던지도록 모의 함수 설정
//       userRepositoryMock.save.mockRejectedValueOnce({
//         code: '23505',
//         detail: 'email',
//       });

//       // ConflictException이 발생해야 함
//       const user = await expect(
//         usersRepository.createUser(signupDto, hashedPassword),
//       ).rejects.toThrow(ConflictException);

//       expect(userRepositoryMock.create).toHaveBeenCalled();
//       expect(userRepositoryMock.create).toHaveBeenCalledTimes(1);
//       expect(userRepositoryMock.create).toHaveBeenCalledWith({
//         email: signupDto.email,
//         nickname: signupDto.nickname,
//         password: hashedPassword,
//         phoneNumber: signupDto.phoneNumber,
//         isAdmin: signupDto.isAdmin,
//         StoreId: signupDto.StoreId,
//       });

//       expect(userRepositoryMock.save).toHaveBeenCalledWith(user);
//       expect(userRepositoryMock.save).toHaveBeenCalled();
//       expect(userRepositoryMock.save).toHaveBeenCalledTimes(1);
//     });

//     it('should throw ConflictException for duplicate StoreId', async () => {
//       const signupDto: SignupDto = {
//         email: 'test@example.com',
//         nickname: 'test',
//         password: 'password',
//         confirm: 'password',
//         phoneNumber: '010-1234-5678',
//       };
//       const hashedPassword = 'hashedPassword';

//       // 중복된 닉네임을 가지는 예외를 발생시키기 위해, save 함수가 중복된 닉네임 에러를 던지도록 모의 함수 설정
//       userRepositoryMock.save.mockRejectedValueOnce({
//         code: '23505',
//         detail: 'StoreId',
//       });

//       // ConflictException이 발생해야 함
//       const user = await expect(
//         usersRepository.createUser(signupDto, hashedPassword),
//       ).rejects.toThrow(ConflictException);

//       expect(userRepositoryMock.create).toHaveBeenCalled();
//       expect(userRepositoryMock.create).toHaveBeenCalledTimes(1);
//       expect(userRepositoryMock.create).toHaveBeenCalledWith({
//         email: signupDto.email,
//         nickname: signupDto.nickname,
//         password: hashedPassword,
//         phoneNumber: signupDto.phoneNumber,
//         isAdmin: signupDto.isAdmin,
//         StoreId: signupDto.StoreId,
//       });

//       expect(userRepositoryMock.save).toHaveBeenCalledWith(user);
//       expect(userRepositoryMock.save).toHaveBeenCalled();
//       expect(userRepositoryMock.save).toHaveBeenCalledTimes(1);
//     });
//   });

//   describe('updateRefreshToken', () => {
//     it('shoud update refresh token', async () => {
//       const userId = 1;
//       const refreshToken = 'refresh token';

//       await usersRepository.updateRefreshToken(userId, refreshToken);

//       expect(userRepositoryMock.update).toHaveBeenCalled();
//       expect(userRepositoryMock.update).toHaveBeenCalledTimes(1);
//       expect(userRepositoryMock.update).toHaveBeenCalledWith(
//         { userId },
//         { refreshToken },
//       );
//     });

//     it('shoud throw error', async () => {
//       const userId = 1;
//       const refreshToken = 'refresh token';

//       userRepositoryMock.update.mockRejectedValueOnce(new Error());

//       // ConflictException이 발생해야 함
//       await expect(
//         usersRepository.updateRefreshToken(userId, refreshToken),
//       ).rejects.toThrow(Error);

//       expect(userRepositoryMock.update).toHaveBeenCalled();
//       expect(userRepositoryMock.update).toHaveBeenCalledTimes(1);
//       expect(userRepositoryMock.update).toHaveBeenCalledWith(
//         { userId },
//         { refreshToken },
//       );
//     });
//   });

//   describe('findUserById', () => {
//     it('should return the user', async () => {
//       const userId = 1;
//       const mockUser = {
//         userId,
//         email: 'test@example.com',
//         nickname: 'test',
//         password: 'password',
//         phoneNumber: '010-1234-5678',
//         isAdmin: false,
//         StoreId: null,
//       };

//       userRepositoryMock.findOne.mockResolvedValue(mockUser);

//       const user = await usersRepository.findUserById(userId);

//       expect(user).toEqual(mockUser);

//       expect(userRepositoryMock.findOne).toBeCalled();
//       expect(userRepositoryMock.findOne).toBeCalledTimes(1);
//       expect(userRepositoryMock.findOne).toBeCalledWith({
//         where: { userId },
//       });
//     });

//     it('should throw error', async () => {
//       const userId = 1;

//       userRepositoryMock.findOne.mockRejectedValueOnce(new Error());

//       await expect(usersRepository.findUserById(userId)).rejects.toThrow(Error);

//       expect(userRepositoryMock.findOne).toBeCalled();
//       expect(userRepositoryMock.findOne).toBeCalledTimes(1);
//       expect(userRepositoryMock.findOne).toBeCalledWith({
//         where: { userId },
//       });
//     });
//   });
// });
