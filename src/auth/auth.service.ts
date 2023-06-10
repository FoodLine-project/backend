import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { SignupDto, LoginDto } from './dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Tokens } from './types';
import { Users } from './users.entity';
// import { StoresRepository } from '../stores/stores.repository';

@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');

  constructor(
    private usersRepository: UsersRepository,
    // private storesRepository: StoresRepository,
    private jwtService: JwtService,
  ) {}

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
    if (signupDto.password.includes(signupDto.nickname)) {
      // this.logger.error(`비밀번호에 닉네임을 포함할 수 없습니다.`);
      throw new BadRequestException(`비밀번호에 닉네임을 포함할 수 없습니다.`);
    }

    if (signupDto.password !== signupDto.confirm) {
      // this.logger.error(`비밀번호와 비밀번호 확인이 일치하지 않습니다.`);
      throw new BadRequestException(
        `비밀번호와 비밀번호 확인이 일치하지 않습니다.`,
      );
    }

    const hashedPassword = await this.hash(signupDto.password);

    try {
      await this.usersRepository.createUser(signupDto, hashedPassword);
    } catch (error) {
      // this.logger.error(`회원가입 실패 - Error: ${error}`);
      throw error;
    }

    // this.logger.verbose(`회원가입 성공 - Email: ${signupDto.email}`);
  }

  async login(loginDto: LoginDto): Promise<Tokens> {
    const { email, password } = loginDto;

    const user = await this.usersRepository.findUserByEmail(email);
    if (!user) {
      // this.logger.error(`존재하지 않는 이메일입니다. - Email: ${email}`);
      throw new NotFoundException(`존재하지 않는 이메일입니다.`);
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      // this.logger.error(`비밀번호가 일치하지 않습니다. - Email: ${email}`);
      throw new UnauthorizedException(`비밀번호가 일치하지 않습니다.`);
    }

    try {
      const tokens = await this.getTokens(user);
      const hashedRefreshToken = await this.hash(tokens.refreshToken);
      await this.usersRepository.updateRefreshToken(
        user.userId,
        hashedRefreshToken,
      );

      // this.logger.verbose(`로그인 성공 - Email: ${email}`);

      return tokens;
    } catch (error) {
      // this.logger.error(`로그인 실패 - Error: ${error}`);
      throw error;
    }
  }

  async logout(userId: number): Promise<void> {
    try {
      await this.usersRepository.updateRefreshToken(userId, null);
      // this.logger.verbose(`로그아웃 성공 - userId: ${userId}`);
    } catch (error) {
      // this.logger.error(`로그아웃 실패 - userId: ${userId}, Error: ${error}`);
      throw error;
    }
  }

  async refreshAccessToken(
    userId: number,
    refreshToken: string,
  ): Promise<string> {
    const user = await this.usersRepository.findUserById(userId);

    if (!user.refreshToken) {
      // this.logger.error(`로그인이 필요합니다. - userId: ${userId}`);
      throw new NotFoundException(`로그인이 필요합니다.`);
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!refreshTokenMatches) {
      // this.logger.error(`로그인이 필요합니다. - userId: ${userId}`);
      throw new UnauthorizedException(`로그인이 필요합니다.`);
    }

    try {
      const accessToken = await this.getAccessToken(user);

      // this.logger.verbose(`토큰 재발급 성공 - userId: ${userId}`);

      return accessToken;
    } catch (error) {
      // this.logger.error(
      //   `토큰 재발급 실패 - userId: ${userId}, Error: ${error}`,
      // );
      throw error;
    }
  }

  async getUserInfo(userId: number): Promise<Users> {
    return await this.usersRepository.findUserById(userId);
  }

  // async genRandomAdminUsers() {
  //   const storeCount = (await this.storesRepository.findAll()).length;
  //   console.log(storeCount);

  //   await this.usersRepository.createAdminUsers(storeCount);
  // }
}
