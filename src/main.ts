import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe()); // ValidationPipe를 전역에서 사용
  await app.listen(3000, () => {
    console.log('3000 포트로 연결되었습니다.');
  });
}
bootstrap();
