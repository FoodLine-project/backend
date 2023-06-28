import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { SignupDto, LoginDto } from './dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Tokens } from './types';
import { Users } from './users.entity';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { StoresRepository } from '../stores/stores.repository';

@Injectable()
export class AuthService {
  constructor(
    @InjectRedis('ec2redis') private readonly client: Redis,
    private usersRepository: UsersRepository,
    private storesRepository: StoresRepository,
    private jwtService: JwtService,
  ) {}

  async hash(target: string): Promise<string> {
    return await bcrypt.hash(target, 2);
  }

  async getAccessToken(user: Users): Promise<string> {
    const { userId, email, nickname, isAdmin, StoreId } = user;

    return await this.jwtService.signAsync(
      {
        userId,
        email,
	nickname,
        isAdmin,
        StoreId,
      },
      {
        secret: process.env.JWT_AT_SECRET_KEY,
        expiresIn: '2h',
      },
    );
  }

  async getRefreshToken(user: Users): Promise<string> {
    const { userId, email, nickname, isAdmin, StoreId } = user;

    return await this.jwtService.signAsync(
      {
        userId,
        email,
	nickname,
        isAdmin,
        StoreId,
      },
      {
        secret: process.env.JWT_RT_SECRET_KEY,
        expiresIn: '7d',
      },
    );
  }

  // 액세스 토큰과 리프레시 토큰을 발급받아 반환하는 메소드
  async getTokens(user: Users): Promise<Tokens> {
    const [accessToken, refreshToken] = [
      await this.getAccessToken(user),
      await this.getRefreshToken(user),
    ];

    return {
      accessToken,
      refreshToken,
    };
  }

  async signUp(signupDto: SignupDto): Promise<void> {
    if (signupDto.password.includes(signupDto.nickname)) {
      throw new BadRequestException('비밀번호에 닉네임을 포함할 수 없습니다.');
    }

    if (signupDto.password !== signupDto.confirm) {
      throw new BadRequestException(
        '비밀번호와 비밀번호 확인이 일치하지 않습니다.',
      );
    }

    const hashedPassword = await this.hash(signupDto.password);

    await this.usersRepository.createUser(signupDto, hashedPassword);
  }

  async login(loginDto: LoginDto): Promise<Tokens> {
    const { email, password } = loginDto;

    const user = await this.usersRepository.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('존재하지 않는 이메일입니다.');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
    }

    const tokens = await this.getTokens(user);

    await this.client.set(
      `user:${user.userId}:refresh_token`,
      tokens.refreshToken,
    );
    await this.client.expire(`user:${user.userId}:refresh_token`, 604800);

    return tokens;
  }

  async logout(user: Users): Promise<void> {
    await this.client.del(`user:${user.userId}:refresh_token`);
  }

  async refreshAccessToken(user: Users, refreshToken: string): Promise<string> {
    const refreshTokenFromRedis = await this.client.get(
      `user:${user.userId}:refresh_token`,
    );

    if (!refreshTokenFromRedis) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }

    if (refreshToken !== refreshTokenFromRedis) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }

    return await this.getAccessToken(user);
  }

  async getUserInfo(userId: number): Promise<Users> {
    return await this.usersRepository.findUserById(userId);
  }

  async genRandomAdminUsers() {
    const storeCount = (await this.storesRepository.findAll()).length;

    await this.usersRepository.createRandomAdminUsers(storeCount);
  }

  async genRandomUsers(count: number) {
    await this.usersRepository.createRandomAdminUsers(count);
  }
}
