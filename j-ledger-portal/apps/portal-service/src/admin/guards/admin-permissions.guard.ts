import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '@repo/dto';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AdminService } from '../services/admin.service';

@Injectable()
export class AdminPermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private adminService: AdminService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.sub) {
      return false;
    }

    const userPermissions = await this.adminService.getStaffPermissions(
      user.sub,
    );

    // Require ALL permissions listed
    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }
}
