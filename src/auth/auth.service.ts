import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { SignupDto, LoginDto } from './dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Tokens } from './types';
import { Users } from './users.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UsersRepository) private usersRepository: UsersRepository,
    private jwtService: JwtService,
  ) {}

  // target 문자열을 해시해서 반환하는 메소드
  // - password와 refreshToken을 db에 저장 전 해싱 하기 위해
  async hash(target: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return await bcrypt.hash(target, salt);
  }

  async getAccessToken(user: Users): Promise<string> {
    const { userId, email, isAdmin, StoreId } = user;

    return await this.jwtService.signAsync(
      {
        userId,
        email,
        isAdmin,
        StoreId,
      },
      {
        secret: `${process.env.JWT_AT_SECRET_KEY}`,
        expiresIn: '2h',
      },
    );
  }

  async getRefreshToken(user: Users): Promise<string> {
    const { userId, email, isAdmin, StoreId } = user;

    return await this.jwtService.signAsync(
      {
        userId,
        email,
        isAdmin,
        StoreId,
      },
      {
        secret: `${process.env.JWT_RT_SECRET_KEY}`,
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
    const hashedPassword = await this.hash(signupDto.password);

    return await this.usersRepository.createUser(signupDto, hashedPassword);
  }

  async login(loginDto: LoginDto): Promise<Tokens> {
    const { email, password } = loginDto;

    const user = await this.usersRepository.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException(`존재하지 않는 이메일입니다.`);
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException(`비밀번호가 일치하지 않습니다.`);
    }

    const tokens = await this.getTokens(user);
    const hashedRefreshToken = await this.hash(tokens.refreshToken);
    await this.usersRepository.updateRefreshToken(
      user.userId,
      hashedRefreshToken,
    );

    return tokens;
  }

  async logout(userId: number): Promise<void> {
    await this.usersRepository.updateRefreshToken(userId, null);
  }

  async refreshAccessToken(
    userId: number,
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    const user = await this.usersRepository.findUserById(userId);

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!refreshTokenMatches) {
      throw new UnauthorizedException(`로그인이 필요합니다.`);
    }

    const accessToken = await this.getAccessToken(user);

    return { accessToken };
  }

  async getUserInfo(userId: number): Promise<Users> {
    return await this.usersRepository.findUserById(userId);
  }
}
