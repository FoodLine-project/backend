import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
// import { config } from 'dotenv';
import * as cors from 'cors';

async function bootstrap() {
  // const result = config();
  // if (result.error) {
  //   throw result.error;
  // }

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe()); // ValidationPipe를 전역에서 사용

  app.use(cors());
  await app.listen(3000, () => {
    console.log('3000 포트로 연결되었습니다.');
  });
}
bootstrap();
