import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { AdminUserPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // Test / Dev Header bypass
    if (process.env.NODE_ENV !== 'production' && request.headers['x-user-id']) {
      const rolesHeader = request.headers['x-user-roles'];
      const roles = typeof rolesHeader === 'string'
        ? rolesHeader.split(',').map((r: string) => r.trim())
        : (Array.isArray(rolesHeader) ? rolesHeader : ['ADMIN']);

      request.user = {
        userId: request.headers['x-user-id'],
        email: request.headers['x-user-email'] || 'admin@marketplace.com',
        roles,
      } as AdminUserPayload;
      return true;
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    const secret = this.configService.get<string>('JWT_SECRET') || 'supersecretkeysharedacrossmicroservices2026';

    try {
      const decoded = jwt.verify(token, secret) as any;
      const roles = decoded.roles || (decoded.role ? [decoded.role] : ['ADMIN']);

      request.user = {
        userId: decoded.sub || decoded.userId || decoded.id,
        email: decoded.email,
        roles,
      } as AdminUserPayload;

      return true;
    } catch (err: any) {
      this.logger.warn(`JWT verification failed: ${err.message}`);
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}
