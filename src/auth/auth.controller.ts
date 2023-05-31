import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
  constructor(private authService: AuthService) {}

  @Public() // 회원가입 시에는 인증 절차를 거칠 필요 x
  @Post('/signup')
  @HttpCode(HttpStatus.CREATED) // 상태코드 설정
  async signUp(@Body() signupDto: SignupDto): Promise<{ message: string }> {
    return await this.authService.signUp(signupDto).then(() => {
      return { message: '회원가입에 성공했습니다.' };
    });
  }

  @Public()
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<Tokens> {
    return await this.authService.login(loginDto);
  }

  @Patch('/logout')
  @HttpCode(HttpStatus.OK)
  async logout(@GetUserId() userId: number): Promise<{ message: string }> {
    return await this.authService.logout(userId).then(() => {
      return { message: '로그아웃 되었습니다.' };
    });
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshAccessToken(
    @GetUserId() userId: number,
    @GetUser('refreshToken') refreshToken: string,
  ): Promise<{ accessToken: string }> {
    return await this.authService.refreshAccessToken(userId, refreshToken);
  }

  @Get('/test')
  async getMyProfile(@GetUser() user: Users): Promise<Users> {
    return user;
  }
}
