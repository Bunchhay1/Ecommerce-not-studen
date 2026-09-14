import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const headerName = 'X-Correlation-ID';
    const correlationId = (req.headers[headerName.toLowerCase()] as string) || randomUUID();
    req.headers[headerName.toLowerCase()] = correlationId;
    res.setHeader(headerName, correlationId);
    next();
  }
}
