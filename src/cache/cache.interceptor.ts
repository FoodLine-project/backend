import {
  // CACHE_KEY_METADATA,
  CACHE_MANAGER,
  // CACHE_TTL_METADATA,
} from '@nestjs/cache-manager';
import {
  Injectable,
  ExecutionContext,
  Optional,
  Inject,
  CallHandler,
  HttpServer,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

const HTTP_ADAPTER_HOST = 'HttpAdapterHost';
const REFLECTOR = 'Reflector';

export interface HttpAdapterHost<T extends HttpServer = any> {
  httpAdapter: T;
}

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  @Optional()
  @Inject(HTTP_ADAPTER_HOST)
  protected readonly httpAdapterHost: HttpAdapterHost;

  protected allowedMethods = ['GET', 'POST'];
  constructor(
    @Inject(CACHE_MANAGER) protected readonly cacheManager: any,
    @Inject(REFLECTOR) protected readonly reflector: any,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const key = this.trackBy(context);
    //ttl을 redis에 set하는 과정
    // const ttlValueOrFactory =
    //   this.reflector.get(CACHE_TTL_METADATA, context.getHandler()) ?? null;

    if (!key) {
      return next.handle();
    }
    try {
      const value = await this.cacheManager.get(key);
      //console.log('value:', value);
      if (value !== undefined && value !== null) {
        return of(value);
      }
      // const ttl =
      //   typeof ttlValueOrFactory === 'function'
      //     ? await ttlValueOrFactory(context)
      //     : ttlValueOrFactory;
      const ttl = 300;
      return next.handle().pipe(
        tap((response) => {
          const args =
            ttl === undefined ? [key, response] : [key, response, ttl];
          this.cacheManager.set(...args);
        }),
      );
    } catch {
      return next.handle();
    }
  }

  protected trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const body = JSON.stringify(request.body);
    const key = `${method}:${url}:${body}`;

    return key;
  }

  protected isRequestCacheable(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    return this.allowedMethods.includes(req.method);
  }
}
