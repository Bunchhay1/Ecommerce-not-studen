import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Default to mock/anonymous for endpoints that allow public or test access
      request.user = { id: 'anonymousUser', email: 'guest@example.com', roles: ['ROLE_CUSTOMER'] };
      return true;
    }

    const token = authHeader.split(' ')[1];
    const secret = this.configService.get<string>('jwt.secret', 'supersecretjwtkeyforidentityservice2026ecommerceplatform');

    try {
      const decoded = jwt.verify(token, secret) as any;
      request.user = {
        id: decoded.sub || decoded.id || decoded.userId,
        email: decoded.email,
        roles: decoded.roles || [decoded.role || 'ROLE_CUSTOMER'],
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}
