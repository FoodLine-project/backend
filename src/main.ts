import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe()); // ValidationPipe를 전역에서 사용

  app.use(cors());

  const port = 3300;
  await app.listen(port, () => {
    console.log(`${port} 포트로 연결되었습니다.`);
  });
}
bootstrap();
