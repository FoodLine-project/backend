import { UsersRepository } from './users.repository';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './users.entity';
import { AccessTokenStrategy } from './strategies';
import { RefreshTokenStrategy } from './strategies';
import { Stores } from '../stores/stores.entity';
import { Tables } from '../tables/tables.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    TypeOrmModule.forFeature([Users, Stores, Tables]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersRepository,
    AccessTokenStrategy,
    RefreshTokenStrategy,
  ],
  exports: [PassportModule],
})
export class AuthModule {}
