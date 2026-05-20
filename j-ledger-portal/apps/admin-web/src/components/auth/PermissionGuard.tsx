'use client';

import { ReactNode } from 'react';
import { Permission } from '@repo/dto';

interface PermissionGuardProps {
  children: ReactNode;
  permissions: string[];
  require: Permission | Permission[];
  mode?: 'AND' | 'OR';
  fallback?: ReactNode;
}

export function PermissionGuard({
  children,
  permissions,
  require,
  mode = 'OR',
  fallback = null,
}: PermissionGuardProps) {
  const requirements = Array.isArray(require) ? require : [require];

  const hasPermission =
    mode === 'OR'
      ? requirements.some((p) => permissions.includes(p))
      : requirements.every((p) => permissions.includes(p));

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
