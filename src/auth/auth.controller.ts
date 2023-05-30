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
import { GetCurrentUser, GetCurrentUserId, Public } from './common/decorators';
import { RefreshTokenGuard } from './guards';
import { Users } from './users.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public() // 회원가입 시에는 인증 절차를 거칠 필요 x
  @Post('/signup')
  @HttpCode(HttpStatus.CREATED) // 상태코드 설정
  signUp(@Body() signupDto: SignupDto): Promise<void> {
    return this.authService.signUp(signupDto);
  }

  @Public()
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<Tokens> {
    return this.authService.login(loginDto);
  }

  @Patch('/logout')
  @HttpCode(HttpStatus.OK)
  logout(@GetCurrentUserId() userId: number): Promise<void> {
    return this.authService.logout(userId);
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('/refresh')
  @HttpCode(HttpStatus.OK)
  refreshAccessToken(
    @GetCurrentUserId() userId: number,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ): Promise<{ accessToken: string }> {
    return this.authService.refreshAccessToken(userId, refreshToken);
  }

  @Get('/test')
  getMyProfile(@GetCurrentUserId() userId: number): Promise<Users> {
    return this.authService.getUserInfo(userId);
  }
}
