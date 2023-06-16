import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto } from './dto';
import { Tokens } from './types';
import { GetUser, Public } from './common/decorators';
import { RefreshTokenGuard } from './guards';
import { Users } from './users.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('/signup')
  async signUp(@Body() signupDto: SignupDto): Promise<{ message: string }> {
    try {
      await this.authService.signUp(signupDto);

      return { message: '회원가입에 성공했습니다.' };
    } catch (error) {
      throw error;
    }
  }

  @Public()
  @Post('/login')
  async login(@Body() loginDto: LoginDto): Promise<Tokens> {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      throw error;
    }
  }

  @Delete('/logout')
  async logout(@GetUser() user: Users): Promise<{ message: string }> {
    try {
      await this.authService.logout(user);

      return { message: '로그아웃 되었습니다.' };
    } catch (error) {
      throw error;
    }
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('/refresh')
  async refreshAccessToken(
    @GetUser() user: Users,
  ): Promise<{ accessToken: string }> {
    try {
      const accessToken = await this.authService.refreshAccessToken(user);

      return { accessToken };
    } catch (error) {
      throw error;
    }
  }

  @Get('/profile')
  async getMyProfile(@GetUser() user: Users): Promise<Users> {
    return user;
  }

  // @Public()
  // @Post('/gen-random-admin-users')
  // async genRandomUsers() {
  //   return await this.authService.genRandomAdminUsers();
  // }
}
