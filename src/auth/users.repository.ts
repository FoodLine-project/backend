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
          throw new ConflictException('중복된 닉네임입니다.');
        } else if (e.detail.includes('email')) {
          throw new ConflictException('중복된 이메일입니다.');
        } else if (e.detail.includes('StoreId')) {
          throw new ConflictException(`중복된 음식점 ID 입니다.`);
        }
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
