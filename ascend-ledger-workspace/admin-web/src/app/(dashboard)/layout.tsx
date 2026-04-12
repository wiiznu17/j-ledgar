import { cookies, headers } from 'next/headers';
import { Toaster } from '@/components/ui/sonner';
import { DashboardWrapper } from '@/components/layout/DashboardWrapper';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value || 'SUPPORT_STAFF';
  
  // Workaround to get pathname in server component if needed, 
  // or just handle it in the client wrapper.
  // const headersList = await headers();
  // const pathname = headersList.get('x-pathname') || '/dashboard';

  return (
    <>
      <DashboardWrapper userRole={userRole}>
        {children}
      </DashboardWrapper>
      <Toaster position="top-right" />
    </>
  );
}
