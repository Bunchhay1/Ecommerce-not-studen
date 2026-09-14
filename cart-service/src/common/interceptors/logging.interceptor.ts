import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const { method, url } = req;
    const requestId = (req.headers['x-request-id'] as string) || `req_${Date.now()}`;
    const startTime = Date.now();

    res.setHeader('X-Request-ID', requestId);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        res.setHeader('X-Process-Time-Ms', duration);
        this.logger.log(
          `[${requestId}] ${method} ${url} ${res.statusCode} - ${duration}ms`,
        );
      }),
    );
  }
}
