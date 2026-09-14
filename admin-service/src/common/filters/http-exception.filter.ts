import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        message = res.message || exception.message;
        errorCode = res.error || (HttpStatus[status] || 'ERROR');
        details = res.details || (Array.isArray(res.message) ? res.message : null);
      } else {
        message = exception.message;
        errorCode = HttpStatus[status] || 'ERROR';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unexpected Exception: ${exception.message}`, exception.stack);
    }

    response.status(status).json({
      status: 'error',
      errorCode,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.headers['x-request-id'] || null,
    });
  }
}
