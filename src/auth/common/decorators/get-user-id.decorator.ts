import { ExecutionContext, createParamDecorator } from '@nestjs/common';

// 현재 로그인되어있는 사용자의 id(sub)를 가져오는 데코레이터

// 액세스 토큰을 발급 받을 때 userId를 sub에 넣어준다 (auth.service.ts:getTokens 메소드)
// - sub: 일반적으로 사용자의 고유한 식별자를 담는다 (jwt 표준 클레임)
// - 클레임: jwt의 내용(payload)에 포함되는 정보를 나타내는 단위

export const GetUserId = createParamDecorator(
  (data: undefined, context: ExecutionContext): number => {
    const request = context.switchToHttp().getRequest();

    return request.user['userId'];
  },
);
