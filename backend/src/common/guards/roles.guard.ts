import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.get<string[]>('roles', ctx.getHandler())
    if (!required) return true
    const { user } = ctx.switchToHttp().getRequest()
    if (!required.includes(user?.role)) throw new ForbiddenException('Insufficient permissions')
    return true
  }
}