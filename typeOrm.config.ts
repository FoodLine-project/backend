import { Stores } from './src/stores/stores.entity';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { AddColumn1686766534159 } from './src/migrations/1686766534159-addColumn';
import { Waitings } from './src/waitings/waitings.entity';
import { Reviews } from './src/reviews/reviews.entity';
import { Tables } from './src/tables/tables.entity';
import { Users } from './src/auth/users.entity';

config();

const configService = new ConfigService();

export const dataSource = new DataSource({
  type: 'postgres',
  host: configService.get('POSTGRES_HOST'),
  port: 5432,
  username: configService.get('POSTGRES_USERNAME'),
  password: configService.get('POSTGRES_PASSWORD'),
  database: 'temp',
  entities: [Stores, Waitings, Reviews, Tables, Users],
  migrations: [AddColumn1686766534159],
  // migrationsTableName: 'custom_migration_table',
});

dataSource
  .initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((error) => {
    console.error('Error during Data Source initialization', error);
  });
