import { Repository } from 'typeorm';
import { Users } from './users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SignupDto } from './dto';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

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
    } catch (err) {
      if (err.code === '23505') {
        if (err.detail.includes('nickname')) {
          throw new ConflictException('중복된 닉네임입니다.');
        } else if (err.detail.includes('email')) {
          throw new ConflictException('중복된 이메일입니다.');
        } else if (err.detail.includes('StoreId')) {
          throw new ConflictException('중복된 음식점 ID 입니다.');
        }
      }

      console.error(err);
      throw new InternalServerErrorException();
    }
  }

  async findUserByEmail(email: string): Promise<Users> {
    return await this.users.findOne({ where: { email } });
  }

  async findUserById(userId: number): Promise<Users> {
    return await this.users.findOne({ where: { userId } });
  }

  async createRandomAdminUsers(length: number) {
    const dummyUsers = [];

    for (let i = 0; i < length; i++) {
      const dummyUser = new Users();

      dummyUser.email = `admin${i + 1}@example.com`;

      dummyUser.nickname = `admin${i + 1}`;

      dummyUser.password = await bcrypt.hash('1q2w3e4r', 2);

      dummyUser.phoneNumber = `010-${Math.floor(
        1000 + Math.random() * 9000,
      )}-${Math.floor(1000 + Math.random() * 9000)}`;

      dummyUser.isAdmin = true;
      dummyUser.StoreId = i + 1;

      dummyUsers.push(dummyUser);

      try {
        await this.users.save(dummyUser);
      } catch (err) {
        throw err;
      }
    }
  }

  async createRandomUsers(length: number) {
    const dummyUsers = [];

    for (let i = 0; i < length; i++) {
      const dummyUser = new Users();

      dummyUser.email = `user${i + 1}@example.com`;

      dummyUser.nickname = `user${i + 1}`;

      dummyUser.password = await bcrypt.hash('1q2w3e4r', 2);

      dummyUser.phoneNumber = `010-${Math.floor(
        1000 + Math.random() * 9000,
      )}-${Math.floor(1000 + Math.random() * 9000)}`;

      dummyUser.isAdmin = false;
      dummyUser.StoreId = null;

      dummyUsers.push(dummyUser);

      try {
        await this.users.save(dummyUser);
      } catch (err) {
        throw err;
      }
    }
  }
}
