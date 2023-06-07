import { UsersRepository } from './users.repository';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './users.entity';
import { LocationService } from 'src/location/location.service';
import { AccessTokenStrategy } from './strategies';
import { RefreshTokenStrategy } from './strategies';
import { Stores } from 'src/stores/stores.entity';
import { StoresRepository } from 'src/stores/stores.repository';
import { TablesRepository } from 'src/tables/tables.repository';
import { Tables } from 'src/tables/tables.entity';

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
    StoresRepository,
    TablesRepository,
    LocationService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
  ],
  exports: [PassportModule],
})
export class AuthModule {}
