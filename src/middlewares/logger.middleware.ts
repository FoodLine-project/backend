import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const userAgent = req.get('user-agent') || '';

    res.on('finish', () => {
      // console.log(res);
      const { statusCode } = res;
      const contentLength = res.get('content-length');

      if (String(statusCode)[0] === '4') {
        this.logger.error(
          `${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent}`,
        );
      } else {
        this.logger.log(
          `${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent}`,
        );
      }
    });

    next();
  }
}
