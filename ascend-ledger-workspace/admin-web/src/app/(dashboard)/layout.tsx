'use client';

import { logout } from '@/app/actions/auth';
import { Toaster } from '@/components/ui/sonner';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-secondary/30 flex h-screen overflow-hidden">
      {/* Sidebar Component */}
      <Sidebar pathname={pathname} onLogout={logout} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Topbar Component */}
        <Topbar title="J-Ledger Admin" />

        {/* Content injection */}
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}

