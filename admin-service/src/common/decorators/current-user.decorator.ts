import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AdminUserPayload {
  userId: string;
  email?: string;
  roles: string[];
  permissions?: string[];
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AdminUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
