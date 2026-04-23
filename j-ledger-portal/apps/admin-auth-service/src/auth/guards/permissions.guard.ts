import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StaffService } from '../../staff/staff.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private staffService: StaffService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const staff = await this.staffService.findById(user.id);

    if (!staff) {
      throw new ForbiddenException('Staff not found');
    }

    const userPermissions = new Set<string>();

    for (const staffRole of staff.staffRoles) {
      for (const rolePermission of staffRole.role.rolePermissions) {
        userPermissions.add(rolePermission.permission.name);
      }
    }

    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.has(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
