import { SetMetadata } from '@nestjs/common';

export const SkipCache = () => SetMetadata('skipCache', true);
