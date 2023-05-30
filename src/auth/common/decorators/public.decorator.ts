import { SetMetadata } from '@nestjs/common';

// Public 데코레이터가 적용되는 핸들러 혹은 클래스의 isPublic 메타데이터를 true로 설정하는 데코레이터

export const Public = () => SetMetadata('isPublic', true);
