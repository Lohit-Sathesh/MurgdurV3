import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_KEY } from '../decorators/admin.decorator';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: { role?: string } }>();
    const userRole = request.user?.role;

    if (userRole !== 'ADMIN' && userRole !== 'SUPPORT') {
      throw new ForbiddenException('Admin access required');
    }

    const adminOnly = this.reflector.getAllAndOverride<boolean>(ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (adminOnly && userRole !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
