'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { logout } from '@/app/actions/auth';

interface DashboardWrapperProps {
  children: React.ReactNode;
  userRole: string;
}

export function DashboardWrapper({ children, userRole }: DashboardWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex h-screen overflow-hidden">
      <Sidebar onLogout={logout} isCollapsed={isCollapsed} userRole={userRole} />

      <div
        className={`flex-1 flex flex-col min-w-0 h-full transition-all duration-300 ease-in-out`}
      >
        <Topbar
          title="J-Ledger Admin"
          onToggle={() => setIsCollapsed(!isCollapsed)}
          onLogout={logout}
        />
        <main className="flex-1 p-8 overflow-auto bg-white">{children}</main>
      </div>
    </div>
  );
}
