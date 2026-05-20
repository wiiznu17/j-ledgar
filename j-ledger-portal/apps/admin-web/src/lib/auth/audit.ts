export interface AuditLog {
  userId: string;
  action: string;
  resource?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: number;
  success: boolean;
  details?: string;
}

export async function logAuditEvent(event: AuditLog): Promise<void> {
  // In production, this would send to a logging service or database
  // For now, we'll log to console and could extend to send to admin-api
  console.log('[AUDIT]', JSON.stringify(event));

  // TODO: Send to admin-api for persistent storage
  // Example:
  // try {
  //   await fetch('/api/admin/audit', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(event),
  //   });
  // } catch (error) {
  //   console.error('Failed to send audit log:', error);
  // }
}

export async function logLoginAttempt(
  userId: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'LOGIN',
    ipAddress,
    userAgent,
    timestamp: Date.now(),
    success,
    details: success ? 'User logged in successfully' : 'Login attempt failed',
  });
}

export async function logLogoutAttempt(
  userId: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'LOGOUT',
    ipAddress,
    userAgent,
    timestamp: Date.now(),
    success: true,
    details: 'User logged out',
  });
}

export async function logAdminAction(
  userId: string,
  action: string,
  resource?: string,
  resourceId?: string,
  details?: string,
): Promise<void> {
  await logAuditEvent({
    userId,
    action,
    resource,
    resourceId,
    timestamp: Date.now(),
    success: true,
    details,
  });
}
