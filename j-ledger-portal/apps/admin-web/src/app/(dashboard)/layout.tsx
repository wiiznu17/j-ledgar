import { cookies } from 'next/headers';
import { Toaster } from '@/components/ui/sonner';
import { DashboardWrapper } from '@/components/layout/DashboardWrapper';
import { verifyToken } from '@/lib/auth/jwt';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;

  if (!token) {
    // This should be caught by middleware, but as a fallback
    return <div>Unauthorized</div>;
  }

  const payload = await verifyToken(token);
  const userRole = payload?.role || 'SUPPORT_STAFF';

  return (
    <>
      <DashboardWrapper userRole={userRole}>{children}</DashboardWrapper>
      <Toaster position="top-right" />
    </>
  );
}
