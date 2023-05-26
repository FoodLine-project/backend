import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { SignupDto, LoginDto } from './dto/auth-credential.dto';
// import { GetUser } from './get-user.decorator';
// import { Users } from './users.entity';
// import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('/signup')
  signUp(@Body(ValidationPipe) signupDto: SignupDto): Promise<void> {
    return this.usersService.signUp(signupDto);
  }

  @Post('/login')
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
  ): Promise<{ accessToken: string }> {
    return this.usersService.login(loginDto);
  }
}
