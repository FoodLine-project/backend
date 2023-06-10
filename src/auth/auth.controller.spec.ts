import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignupDto } from './dto';
import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  INestApplication,
} from '@nestjs/common';
import * as request from 'supertest';
import { UsersRepository } from './users.repository';

class MockUsersRepository {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createUser = jest.fn().mockImplementation((signupDto, hashedPassword) => {
    if (signupDto.nickname === 'existingNickname') {
      throw new ConflictException('중복된 닉네임입니다.');
    }

    if (signupDto.email === 'existingEmail@example.com') {
      throw new ConflictException('중복된 이메일입니다.');
    }

    if (signupDto.StoreId === 1) {
      throw new ConflictException('중복된 음식점 ID 입니다.');
    }

    return Promise.resolve();
  });
}

class MockAuthService {
  usersRepository: MockUsersRepository;
  constructor(usersRepository: MockUsersRepository) {
    this.usersRepository = usersRepository;
  }
  signUp = jest.fn().mockImplementation((signupDto) => {
    const hashedPassword = '';
    return this.usersRepository.createUser(signupDto, hashedPassword);
  });
  login = jest
    .fn()
    .mockImplementation(() =>
      Promise.resolve({ accessToken: '', refreshToken: '' }),
    );
}

describe('AuthController', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let authController: AuthController;
  let authService: AuthService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let usersRepository: UsersRepository;
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useFactory: () => new MockAuthService(new MockUsersRepository()),
        },
        {
          provide: UsersRepository,
          useClass: MockUsersRepository,
        },
      ],
    }).compile();
    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    usersRepository = module.get<UsersRepository>(UsersRepository);
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('signup', () => {
    it('should return a success message and 201 status code on successful signup', async () => {
      const signupDto: SignupDto = {
        email: 'test@example.com',
        nickname: 'test',
        password: 'password',
        confirm: 'password',
        phoneNumber: '010-1234-5678',
      };
      const successMessage = '회원가입에 성공했습니다.';

      jest.spyOn(authService, 'signUp').mockImplementation(async () => {
        await usersRepository.createUser(signupDto, 'hashedPassword');
      });

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupDto);

      expect(response.body).toEqual({ message: successMessage });
      expect(response.status).toEqual(HttpStatus.CREATED);

      expect(authService.signUp).toHaveBeenCalledTimes(1);
      expect(authService.signUp).toHaveBeenCalledWith(signupDto);

      expect(usersRepository.createUser).toHaveBeenCalledTimes(1);
      expect(usersRepository.createUser).toHaveBeenCalledWith(
        signupDto,
        'hashedPassword',
      );
    });

    // it('should throw BadRequestException if password contains nickname', async () => {
    //   const signupDto: SignupDto = {
    //     email: 'test@example.com',
    //     nickname: 'test',
    //     password: 'passwordtest',
    //     confirm: 'passwordtest',
    //     phoneNumber: '010-1234-5678',
    //   };

    //   jest.spyOn(authService, 'signUp').mockImplementation(() => {
    //     throw new BadRequestException(
    //       '비밀번호에 닉네임을 포함할 수 없습니다.',
    //     );
    //   });

    //   const response = await request(app.getHttpServer())
    //     .post('/auth/signup')
    //     .send(signupDto);

    //   expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    //   expect(response.body).toEqual({
    //     error: 'Bad Request',
    //     message: '비밀번호에 닉네임을 포함할 수 없습니다.',
    //     statusCode: HttpStatus.BAD_REQUEST,
    //   });

    //   expect(authService.signUp).toHaveBeenCalledTimes(1);
    //   expect(authService.signUp).toHaveBeenCalledWith(signupDto);
    // });

    // it('should throw BadRequestException if password and confirm do not match', async () => {
    //   const signupDto: SignupDto = {
    //     email: 'test@example.com',
    //     nickname: 'test',
    //     password: '1234asdf',
    //     confirm: '1234fdsa',
    //     phoneNumber: '010-1234-5678',
    //   };

    //   jest.spyOn(authService, 'signUp').mockImplementation(() => {
    //     throw new BadRequestException(
    //       '비밀번호와 비밀번호 확인이 일치하지 않습니다.',
    //     );
    //   });

    //   const response = await request(app.getHttpServer())
    //     .post('/auth/signup')
    //     .send(signupDto);

    //   expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    //   expect(response.body).toEqual({
    //     error: 'Bad Request',
    //     message: '비밀번호와 비밀번호 확인이 일치하지 않습니다.',
    //     statusCode: HttpStatus.BAD_REQUEST,
    //   });

    //   expect(authService.signUp).toHaveBeenCalledTimes(1);
    //   expect(authService.signUp).toHaveBeenCalledWith(signupDto);
    // });

    // it('should throw ConflictException if nickname already exists', async () => {
    //   const signupDto: SignupDto = {
    //     email: 'test@example.com',
    //     nickname: 'existingNickname',
    //     password: '1234asdf',
    //     confirm: '1234asdf',
    //     phoneNumber: '010-1234-5678',
    //   };
    //   await expect(controller.signUp(signupDto)).rejects.toThrow(
    //     ConflictException,
    //   );
    //   await expect(controller.signUp(signupDto)).rejects.toThrow(
    //     '중복된 닉네임입니다.',
    //   );

    //   expect(authService.signUp).toHaveBeenCalledTimes(1);
    //   expect(usersRepository.createUser).toHaveBeenCalledWith(signupDto);

    //   const response = await request(app.getHttpServer())
    //     .post('/auth/signup')
    //     .send(signupDto);

    //   expect(response.status).toBe(HttpStatus.CONFLICT);
    //   expect(response.body).toEqual({
    //     error: 'Conflict',
    //     message: '중복된 닉네임입니다.',
    //     statusCode: HttpStatus.CONFLICT,
    //   });
    // });
  });
});
