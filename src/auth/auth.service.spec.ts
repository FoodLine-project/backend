// import { Test } from '@nestjs/testing';
// import { AuthService } from './auth.service';
// import { UsersRepository } from './users.repository';
// import { SignupDto, LoginDto } from './dto';
// import {
//   UnauthorizedException,
//   NotFoundException,
//   BadRequestException,
// } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import * as bcrypt from 'bcryptjs';
// import { Users } from './users.entity';

// describe('AuthService', () => {
//   let authService: AuthService;
//   let usersRepository: UsersRepository;

//   beforeEach(async () => {
//     const moduleRef = await Test.createTestingModule({
//       providers: [
//         AuthService,
//         {
//           provide: UsersRepository,
//           useValue: {
//             createUser: jest.fn(),
//             updateRefreshToken: jest.fn(),
//             findUserByEmail: jest.fn(),
//             findUserById: jest.fn(),
//           },
//         },
//         JwtService,
//       ],
//     }).compile();

//     authService = moduleRef.get<AuthService>(AuthService);
//     usersRepository = moduleRef.get<UsersRepository>(UsersRepository);
//   });

//   describe('signUp', () => {
//     it('should create a new user', async () => {
//       const signupDto: SignupDto = {
//         email: 'test@example.com',
//         nickname: 'test',
//         password: 'password',
//         confirm: 'password',
//         phoneNumber: '010-1234-5678',
//       };
//       const hashedPassword = 'hashedPassword';

//       jest.spyOn(authService, 'hash').mockResolvedValue(hashedPassword);
//       jest.spyOn(usersRepository, 'createUser').mockResolvedValue();

//       await authService.signUp(signupDto);

//       expect(authService.hash).toHaveBeenCalledWith(signupDto.password);

//       expect(usersRepository.createUser).toHaveBeenCalled();
//       expect(usersRepository.createUser).toHaveBeenCalledTimes(1);
//       expect(usersRepository.createUser).toHaveBeenCalledWith(
//         signupDto,
//         hashedPassword,
//       );
//     });

//     it('should throw BadRequestException if password includes nickname', async () => {
//       const signupDto: SignupDto = {
//         email: 'test@example.com',
//         nickname: 'test',
//         password: 'test123',
//         confirm: 'test123',
//         phoneNumber: '010-1234-5678',
//       };

//       await expect(authService.signUp(signupDto)).rejects.toThrowError(
//         BadRequestException,
//       );

//       jest.spyOn(authService, 'hash').mockResolvedValue('hashedPassword');
//       jest.spyOn(usersRepository, 'createUser').mockResolvedValue();

//       expect(authService.hash).toHaveBeenCalledTimes(0);

//       expect(usersRepository.createUser).toHaveBeenCalledTimes(0);
//     });

//     it('should throw BadRequestException if password and confirm do not match', async () => {
//       const signupDto: SignupDto = {
//         email: 'test@example.com',
//         nickname: 'test',
//         password: 'password',
//         confirm: 'confirm',
//         phoneNumber: '010-1234-5678',
//       };

//       await expect(authService.signUp(signupDto)).rejects.toThrowError(
//         BadRequestException,
//       );

//       jest.spyOn(authService, 'hash').mockResolvedValue('hashedPassword');
//       jest.spyOn(usersRepository, 'createUser').mockResolvedValue();

//       expect(authService.hash).toHaveBeenCalledTimes(0);

//       expect(usersRepository.createUser).toHaveBeenCalledTimes(0);
//     });
//   });

//   describe('login', () => {
//     it('should authenticate and return tokens', async () => {
//       const loginDto: LoginDto = {
//         email: 'test@example.com',
//         password: 'password',
//       };

//       const tokens = {
//         accessToken: 'accessToken',
//         refreshToken: 'refreshToken',
//       };

//       const user = new Users();
//       user.userId = 1;
//       user.email = loginDto.email;
//       user.nickname = 'test';
//       user.password = await bcrypt.hash(loginDto.password, 10);
//       user.isAdmin = false;
//       user.StoreId = null;
//       user.refreshToken = await bcrypt.hash(tokens.refreshToken, 10);

//       jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
//       jest.spyOn(usersRepository, 'findUserByEmail').mockResolvedValue(user);
//       jest.spyOn(authService, 'getTokens').mockResolvedValue(tokens);
//       jest
//         .spyOn(authService, 'hash')
//         .mockResolvedValue(await bcrypt.hash(tokens.refreshToken, 10));
//       // jest.spyOn(usersRepository, 'updateRefreshToken').mockResolvedValue();

//       const result = await authService.login(loginDto);

//       expect(usersRepository.findUserByEmail).toHaveBeenCalled();
//       expect(usersRepository.findUserByEmail).toHaveBeenCalledTimes(1);
//       expect(usersRepository.findUserByEmail).toHaveBeenCalledWith(
//         loginDto.email,
//       );

//       expect(bcrypt.compare).toHaveBeenCalled();
//       expect(bcrypt.compare).toHaveBeenCalledTimes(1);
//       expect(bcrypt.compare).toHaveBeenCalledWith(
//         loginDto.password,
//         user.password,
//       );

//       expect(authService.getTokens).toHaveBeenCalled();
//       expect(authService.getTokens).toHaveBeenCalledTimes(1);
//       expect(authService.getTokens).toHaveBeenCalledWith(user);

//       expect(authService.hash).toHaveBeenCalled();
//       expect(authService.hash).toHaveBeenCalledTimes(1);
//       expect(authService.hash).toHaveBeenCalledWith(tokens.refreshToken);

//       // expect(usersRepository.updateRefreshToken).toHaveBeenCalled();
//       // expect(usersRepository.updateRefreshToken).toHaveBeenCalledTimes(1);
//       // expect(usersRepository.updateRefreshToken).toHaveBeenCalledWith(
//         user.userId,
//         expect.any(String),
//       );

//       expect(result).toEqual(tokens);
//     });

//     it('should throw NotFoundException if user does not exist', async () => {
//       const loginDto: LoginDto = {
//         email: 'test@example.com',
//         password: 'password',
//       };

//       jest
//         .spyOn(usersRepository, 'findUserByEmail')
//         .mockResolvedValue(undefined);

//       await expect(authService.login(loginDto)).rejects.toThrowError(
//         NotFoundException,
//       );

//       expect(usersRepository.findUserByEmail).toHaveBeenCalled();
//       expect(usersRepository.findUserByEmail).toHaveBeenCalledTimes(1);
//       expect(usersRepository.findUserByEmail).toHaveBeenCalledWith(
//         loginDto.email,
//       );
//     });

//     it('should throw UnauthorizedException if password is incorrect', async () => {
//       const loginDto: LoginDto = {
//         email: 'test@example.com',
//         password: 'password',
//       };

//       const user = new Users();
//       user.userId = 1;
//       user.email = 'test@example.com';
//       user.nickname = 'test';
//       user.password = await bcrypt.hash('password', 10);
//       user.isAdmin = false;
//       user.StoreId = null;
//       user.refreshToken = 'refreshToken';

//       jest.spyOn(usersRepository, 'findUserByEmail').mockResolvedValue(user);
//       jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

//       await expect(authService.login(loginDto)).rejects.toThrowError(
//         UnauthorizedException,
//       );

//       expect(usersRepository.findUserByEmail).toHaveBeenCalled();
//       expect(usersRepository.findUserByEmail).toHaveBeenCalledTimes(1);
//       expect(usersRepository.findUserByEmail).toHaveBeenCalledWith(
//         loginDto.email,
//       );

//       expect(bcrypt.compare).toHaveBeenCalled();
//       // TODO: WHY???
//       expect(bcrypt.compare).toHaveBeenCalledTimes(2);
//       expect(bcrypt.compare).toHaveBeenCalledWith(
//         loginDto.password,
//         user.password,
//       );
//     });
//   });

//   // TODO: continue with login error (catch error)

//   // Write tests for other methods
// });
