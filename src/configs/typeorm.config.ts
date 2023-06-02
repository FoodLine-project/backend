import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';

const result = config();
if (result.error) {
  throw result.error;
}

export const typeORMConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  // host: `${process.env.POSTGRES_HOST}`,
  host: 'localhost',
  port: 5432,
  // username: `${process.env.POSTGRES_USERNAME}`,
  // password: `${process.env.POSTGRES_PASSWORD}`,
  username: 'postgres',
  password: 'Wlffjt159!',
  database: `temp`,
  entities: [__dirname + './../**/*.entity.{js,ts}'],
  synchronize: true,
};
