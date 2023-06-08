import { DataSource, Repository } from 'typeorm';
import { Users } from './users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SignupDto } from './dto';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';

export class UsersRepository extends Repository<Users> {
  constructor(@InjectRepository(Users) private dataSource: DataSource) {
    super(Users, dataSource.manager);
  }

  async createUser(
    signupDto: SignupDto,
    hashedPassword: string,
  ): Promise<void> {
    try {
      const user = await this.create({
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

  async createAdminUsers(length: number) {
    const dummyUsers = [];

    for (let i = 0; i < length; i++) {
      const dummyUser = new Users();

      dummyUser.email = faker.internet.email();
      while (dummyUsers.some((user) => user.email === dummyUser.email)) {
        dummyUser.email = faker.internet.email();
      }

      dummyUser.nickname = faker.internet.userName().substring(0, 16);
      while (
        dummyUser.nickname.length < 4 ||
        dummyUsers.some((user) => user.nickname === dummyUser.nickname)
      ) {
        dummyUser.nickname = faker.internet.userName().substring(0, 16);
      }

      const salt = await bcrypt.genSalt();
      dummyUser.password = await bcrypt.hash('1q2w3e4r', salt);

      dummyUser.phoneNumber = `010-${Math.floor(
        1000 + Math.random() * 9000,
      )}-${Math.floor(1000 + Math.random() * 9000)}`;

      dummyUser.isAdmin = true;
      dummyUser.StoreId = i + 1;

      dummyUsers.push(dummyUser);

      await this.save(dummyUser);
      console.log(`${i + 1}번째 admin 사용자 계정이 생성되었습니다.`);
    }
    console.log(`${length}개의 admin 사용자 계정이 생성되었습니다.`);
  }
}
