import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Toaster } from '@/components/ui/sonner';
import { DashboardWrapper } from '@/components/layout/DashboardWrapper';
import { verifyToken } from '@/lib/auth/jwt';
import { AUTH_COOKIE_NAME, PERMISSIONS_COOKIE_NAME } from '@/lib/api-config';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    // This should be caught by middleware, but as a fallback
    return <div>Unauthorized</div>;
  }

  const payload = await verifyToken(token);

  if (!payload) {
    // Token is invalid or expired
    redirect('/login');
  }

  const userRole = payload.role || 'SUPPORT_STAFF';

  const permissionsCookie = cookieStore.get(PERMISSIONS_COOKIE_NAME)?.value;
  let permissions: string[] = [];
  try {
    permissions = permissionsCookie ? JSON.parse(permissionsCookie) : [];
  } catch (e) {
    console.error('Failed to parse permissions cookie', e);
  }

  return (
    <>
      <DashboardWrapper userRole={userRole} permissions={permissions}>
        {children}
      </DashboardWrapper>
      <Toaster position="top-right" />
    </>
  );
}
