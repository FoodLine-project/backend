import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import { UsersService } from './auth.service';
import { SignupDto, LoginDto } from './dto';
import { Tokens } from './types';
import { GetCurrentUser, GetCurrentUserId, Public } from './common/decorators';

@Controller('auth')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Public() // 회원가입 시에는 인증 절차를 거칠 필요 x
  @Post('/signup')
  @HttpCode(HttpStatus.CREATED) // 상태코드 설정
  signUp(@Body() signupDto: SignupDto): Promise<void> {
    return this.usersService.signUp(signupDto);
  }

  @Public()
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<Tokens> {
    return this.usersService.login(loginDto);
  }

  @Patch('/logout')
  @HttpCode(HttpStatus.OK)
  logout(@GetCurrentUserId() userId: number): Promise<void> {
    return this.usersService.logout(userId);
  }

  @Public()
  @Post('/refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @GetCurrentUserId() userId: number,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ): Promise<Tokens> {
    return this.usersService.refreshTokens(userId, refreshToken);
  }
}
