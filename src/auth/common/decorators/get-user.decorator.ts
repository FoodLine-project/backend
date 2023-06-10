import { ExecutionContext, createParamDecorator } from '@nestjs/common';

// 현재 로그인되어있는 사용자 객체를 가져오는 데코레이터

export const GetUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    if (!data) {
      return request.user;
    }

    return request.user[data];
  },
);
