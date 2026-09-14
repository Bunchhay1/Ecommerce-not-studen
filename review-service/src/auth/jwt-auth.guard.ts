import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Mock / fallback for testing or public endpoints
      request.user = { userId: 'anonymous', role: 'CUSTOMER' };
      return true;
    }

    const token = authHeader.split(' ')[1];
    try {
      const secret = this.configService.get<string>('jwt.secret');
      const decoded = jwt.verify(token, secret) as any;
      request.user = {
        userId: decoded.sub || decoded.userId || decoded.id,
        role: decoded.role || 'CUSTOMER',
        email: decoded.email,
      };
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
