import { Repository } from 'typeorm';
import { Users } from './users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SignupDto } from './dto';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  // Logger,
} from '@nestjs/common';
// import { faker } from '@faker-js/faker';
// import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersRepository {
  // private logger = new Logger('UsersRepository');

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

      // this.logger.verbose(`사용자 생성 성공 - Email: ${signupDto.email}`);
    } catch (error) {
      if (error.code === '23505') {
        if (error.detail.includes('nickname')) {
          // this.logger.error(
          //   `중복된 닉네임입니다. - Nickname: ${signupDto.nickname}`,
          // );
          throw new ConflictException('중복된 닉네임입니다.');
        } else if (error.detail.includes('email')) {
          // this.logger.error(`중복된 이메일입니다. - Email: ${signupDto.email}`);
          throw new ConflictException('중복된 이메일입니다.');
        } else if (error.detail.includes('StoreId')) {
          // this.logger.error(
          //   `중복된 음식점 ID 입니다. - StoreId: ${signupDto.StoreId}`,
          // );
          throw new ConflictException(`중복된 음식점 ID 입니다.`);
        }
      }
      // this.logger.error(`사용자 생성 실패 - Error: ${error}`);
      console.error(error);
      throw new InternalServerErrorException();
    }
  }

  async updateRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    try {
      await this.users.update({ userId }, { refreshToken });
      // this.logger.verbose(`Refresh 토큰 업데이트 성공 - userId: ${userId}`);
    } catch (error) {
      // this.logger.error(
      //   `Refresh 토큰 업데이트 실패 - userId: ${userId}, Error: ${error}`,
      // );
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<Users> {
    try {
      return await this.users.findOne({ where: { email } });
    } catch (error) {
      // this.logger.error(
      //   `이메일로 사용자 조회 실패 - Email: ${email}, Error: ${error}`,
      // );
      throw error;
    }
  }

  async findUserById(userId: number): Promise<Users> {
    try {
      return await this.users.findOne({ where: { userId } });
    } catch (error) {
      // this.logger.error(
      //   `사용자 ID로 사용자 조회 실패 - userId: ${userId}, Error: ${error}`,
      // );
      throw error;
    }
  }

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
  //       // this.logger.log(`${i + 1}번째 admin 사용자 계정이 생성되었습니다.`);
  //     } catch (error) {
  //       // this.logger.error(`admin 사용자 계정 생성 실패 - Error: ${error}`);
  //       throw error;
  //     }
  //   }
  //   // this.logger.log(`${length}개의 admin 사용자 계정이 생성되었습니다.`);
  // }
}
