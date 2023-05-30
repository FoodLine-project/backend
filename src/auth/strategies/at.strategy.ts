import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';

//  PassportStrategy 클래스를 상속받는 클래스

//  - PassportStrategy: Passport에서 제공하는 기본 전략들의 기반 클래스
//  - Strategy: Passport에서 실제로 사용할 전략
//  - jwt: 전략의 이름

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      // 헤더에서 Bearer 스킴을 사용하여 jwt 추출
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // jwt의 시크릿 키 검증
      secretOrKey: `${process.env.JWT_AT_SECRET_KEY}`,
    });
  }

  validate(payload: any) {
    return payload;
  }
}
