import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Users } from './user.entity';

export const GetUser = createParamDecorator(
  (data, ctx: ExecutionContext): Users => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
