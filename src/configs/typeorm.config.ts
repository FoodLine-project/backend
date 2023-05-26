import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeORMConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '1234',
  database: '22-project',
  entities: [__dirname + './../**/*.entity.{js,ts}'],
  synchronize: true,
};
