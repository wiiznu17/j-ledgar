'use client';

import { logout } from '@/app/actions/auth';
import { Toaster } from '@/components/ui/sonner';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex h-screen overflow-hidden">
      {/* Sidebar Component */}
      <Sidebar pathname={pathname} onLogout={logout} isCollapsed={isCollapsed} />

      {/* Main content area */}
      <div className={`flex-1 flex flex-col min-w-0 h-full transition-all duration-300 ease-in-out`}>
        {/* Topbar Component */}
        <Topbar title="J-Ledger Admin" onToggle={() => setIsCollapsed(!isCollapsed)} />

        {/* Content injection */}
        <main className="flex-1 p-8 overflow-auto bg-white">
          {children}
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}

