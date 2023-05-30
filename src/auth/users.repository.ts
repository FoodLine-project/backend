import { DataSource, Repository } from 'typeorm';
import { Users } from './users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SignupDto } from './dto';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

export class UsersRepository extends Repository<Users> {
  constructor(@InjectRepository(Users) private dataSource: DataSource) {
    super(Users, dataSource.manager);
  }

  async createUser(
    signupDto: SignupDto,
    hashedPassword: string,
  ): Promise<void> {
    try {
      const user = this.create({
        email: signupDto.email,
        nickname: signupDto.nickname,
        password: hashedPassword,
        phoneNumber: signupDto.phoneNumber,
        isAdmin: signupDto.isAdmin,
        StoreId: signupDto.StoreId,
      });

      await this.save(user);
    } catch (e) {
      if (e.code === '23505') {
        if (e.detail.includes('nickname')) {
          throw new ConflictException('nickname already exists');
        }
        throw new ConflictException('email already exists');
      }
      throw new InternalServerErrorException();
    }
  }

  async updateRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    await this.update({ userId }, { refreshToken });
  }

  async findUserByEmail(email: string): Promise<Users> {
    return await this.findOne({ where: { email } });
  }

  async findUserById(userId: number): Promise<Users> {
    return await this.findOne({ where: { userId } });
  }
}
