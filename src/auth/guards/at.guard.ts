import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

// AuthGuard 클래스를 상속받는 클래스

// - jwt: strategies/at.strategy에서 설정한 전략 이름
// - reflector: 컨트롤러나 핸들러의 메타데이터를 읽어옴

@Injectable()
export class AccessTokenGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // 요청이 들어왔을 때 컨트롤러나 핸들러의 isPublic 메타데이터가 true인 경우
    // 인증 과정을 거치지 않고 요청을 허용함
    const isPublic = this.reflector.getAllAndOverride('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 그렇지 않은 경우 부모 클래스의 인증 과정을 수행함
    return super.canActivate(context);
  }
}
