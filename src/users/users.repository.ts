import { DataSource, Repository } from 'typeorm';
import { Users } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SignupDto } from './dto/auth-credential.dto';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

export class UsersRepository extends Repository<Users> {
  constructor(@InjectRepository(Users) private dataSource: DataSource) {
    super(Users, dataSource.manager);
  }

  async createUser(authCredentialsDto: SignupDto): Promise<void> {
    const { email, nickname, password, phoneNumber } = authCredentialsDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = this.create({
      email,
      nickname,
      password: hashedPassword,
      phoneNumber,
    });

    try {
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

  async findUserByEmail(email: string): Promise<Users> {
    return await this.findOne({ where: { email } });
  }
}
