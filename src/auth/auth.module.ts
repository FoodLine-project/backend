import { UsersRepository } from './users.repository';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Module } from '@nestjs/common';
import { UsersController } from './auth.controller';
import { UsersService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './users.entity';
import { LocationService } from 'src/location/location.service';
import { AccessTokenStrategy } from './strategies';
import { RefreshTokenStrategy } from './strategies';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    TypeOrmModule.forFeature([Users]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    LocationService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
  ],
  exports: [PassportModule],
})
export class UsersModule {}
