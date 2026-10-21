import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ANY_PERMISSIONS_KEY, PERMISSIONS_KEY } from '../decorators/permissions.decorator';

type RequestUser = {
  role: string;
  permissions?: string[];
  isSuperAdmin?: boolean;
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    const anyRequired = this.reflector.getAllAndOverride<string[]>(
      ANY_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length && !anyRequired?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;
    if (!user) return false;
    // Las cuentas cliente siguen usando los endpoints autenticados de su
    // propia conversación; los perfiles administrativos sí requieren permiso.
    if (user.role !== 'ADMIN') return true;
    if (user.isSuperAdmin) return true;

    const granted = new Set(user.permissions ?? []);
    return (required ?? []).every((permission) => granted.has(permission)) &&
      (!anyRequired?.length || anyRequired.some((permission) => granted.has(permission)));
  }
}
