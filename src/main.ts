import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe()); // ValidationPipe를 전역에서 사용

  const port = 3000;
  await app.listen(port);

  logger.log(`애플리케이션이 ${port}포트에 시작되었습니다.`);
}
bootstrap();
