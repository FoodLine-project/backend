import { Repository } from 'typeorm';
import { Users } from './users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SignupDto } from './dto';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
// import { faker } from '@faker-js/faker';
// import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersRepository {
  constructor(@InjectRepository(Users) private users: Repository<Users>) {}

  async createUser(
    signupDto: SignupDto,
    hashedPassword: string,
  ): Promise<void> {
    try {
      const user = this.users.create({
        email: signupDto.email,
        nickname: signupDto.nickname,
        password: hashedPassword,
        phoneNumber: signupDto.phoneNumber,
        isAdmin: signupDto.isAdmin,
        StoreId: signupDto.StoreId,
      });

      await this.users.save(user);
    } catch (error) {
      if (error.code === '23505') {
        if (error.detail.includes('nickname')) {
          throw new ConflictException('중복된 닉네임입니다.');
        } else if (error.detail.includes('email')) {
          throw new ConflictException('중복된 이메일입니다.');
        } else if (error.detail.includes('StoreId')) {
          throw new ConflictException(`중복된 음식점 ID 입니다.`);
        }
      }

      console.error(error);
      throw new InternalServerErrorException();
    }
  }

  async findUserByEmail(email: string): Promise<Users> {
    return await this.users.findOne({ where: { email } });
  }

  async findUserById(userId: number): Promise<Users> {
    return await this.users.findOne({ where: { userId } });
  }

  // async getRefreshToken(userId: number): Promise<string> {
  //   const user = await this.findUserById(userId);
  //   return user.refreshToken;
  // }

  // async updateRefreshToken(
  //   userId: number,
  //   refreshToken: string,
  // ): Promise<void> {
  //   const user = await this.findUserById(userId);
  //   user.refreshToken = refreshToken;
  //   await this.users.save(user);
  // }

  // async createAdminUsers(length: number) {
  //   const dummyUsers = [];

  //   for (let i = 0; i < length; i++) {
  //     const dummyUser = new Users();

  //     dummyUser.email = faker.internet.email();
  //     while (dummyUsers.some((user) => user.email === dummyUser.email)) {
  //       dummyUser.email = faker.internet.email();
  //     }

  //     dummyUser.nickname = faker.internet.userName().substring(0, 16);
  //     while (
  //       dummyUser.nickname.length < 4 ||
  //       dummyUsers.some((user) => user.nickname === dummyUser.nickname)
  //     ) {
  //       dummyUser.nickname = faker.internet.userName().substring(0, 16);
  //     }

  //     const salt = await bcrypt.genSalt();
  //     dummyUser.password = await bcrypt.hash('1q2w3e4r', salt);

  //     dummyUser.phoneNumber = `010-${Math.floor(
  //       1000 + Math.random() * 9000,
  //     )}-${Math.floor(1000 + Math.random() * 9000)}`;

  //     dummyUser.isAdmin = true;
  //     dummyUser.StoreId = i + 1;

  //     dummyUsers.push(dummyUser);

  //     try {
  //       await this.users.save(dummyUser);

  //     } catch (error) {

  //       throw error;
  //     }
  //   }

  // }
}
