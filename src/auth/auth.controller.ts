import {
  Body,
  Controller,
  Get,
  Logger,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto } from './dto';
import { Tokens } from './types';
import { GetUser, GetUserId, Public } from './common/decorators';
import { RefreshTokenGuard } from './guards';
import { Users } from './users.entity';

@Controller('auth')
export class AuthController {
  private logger = new Logger('AuthController');

  constructor(private authService: AuthService) {}

  @Public()
  @Post('/signup')
  async signUp(@Body() signupDto: SignupDto): Promise<{ message: string }> {
    try {
      await this.authService.signUp(signupDto);

      // this.logger.log(`회원가입 성공 - Payload: ${JSON.stringify(signupDto)}`);

      return { message: '회원가입에 성공했습니다.' };
    } catch (error) {
      // this.logger.error(
      //   `회원가입 실패 - Payload: ${JSON.stringify(signupDto)}
      //     Error: ${error}`,
      // );
      throw error;
    }
  }

  @Public()
  @Post('/login')
  async login(@Body() loginDto: LoginDto): Promise<Tokens> {
    try {
      const tokens = await this.authService.login(loginDto);
      // this.logger.log(`로그인 성공 - Payload: ${JSON.stringify(loginDto)}`);
      return tokens;
    } catch (error) {
      // this.logger.error(
      //   `로그인 실패 - Payload: ${JSON.stringify(loginDto)}
      //   Error: ${error}`,
      // );
      throw error;
    }
  }

  @Patch('/logout')
  async logout(@GetUserId() userId: number): Promise<{ message: string }> {
    try {
      await this.authService.logout(userId);
      // this.logger.log(`로그아웃 성공 - userId: ${userId}`);
      return { message: '로그아웃 되었습니다.' };
    } catch (error) {
      // this.logger.error(
      //   `로그아웃 실패 - userId: ${userId}
      //   Error: ${error}`,
      // );
      throw error;
    }
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('/refresh')
  async refreshAccessToken(
    @GetUserId() userId: number,
    @GetUser('refreshToken') refreshToken: string,
  ): Promise<{ accessToken: string }> {
    try {
      const accessToken = await this.authService.refreshAccessToken(
        userId,
        refreshToken,
      );
      // this.logger.log(`액세스 토큰 재발급 성공 - userId: ${userId}`);

      return { accessToken };
    } catch (error) {
      // this.logger.error(
      //   `액세스 토큰 재발급 실패 - userId: ${userId}
      //   Error: ${error}`,
      // );
      throw error;
    }
  }

  @Get('/test')
  async getMyProfile(@GetUser() user: Users): Promise<Users> {
    return user;
  }

  // @Public()
  // @Post('/gen-random-admin-users')
  // async genRandomUsers() {
  //   return await this.authService.genRandomAdminUsers();
  // }
}
