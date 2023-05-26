import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { SignupDto, LoginDto } from './dto/auth-credential.dto';
import { LocationService } from 'src/location/location.service';

@Controller('auth')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private locationService: LocationService,
  ) {}

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
