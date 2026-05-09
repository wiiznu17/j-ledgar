'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { logout } from '@/app/actions/auth';
import { PermissionProvider } from '@/components/auth/PermissionContext';

interface DashboardWrapperProps {
  children: React.ReactNode;
  userRole: string;
  permissions: string[];
}

export function DashboardWrapper({ children, userRole, permissions }: DashboardWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <PermissionProvider role={userRole} permissions={permissions}>
      <div className="min-h-screen bg-slate-50 flex h-screen overflow-hidden">
        <Sidebar
          onLogout={logout}
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
          userRole={userRole}
          permissions={permissions}
        />

        <div
          className={`flex-1 flex flex-col min-w-0 h-full transition-all duration-300 ease-in-out`}
        >
          <Topbar onLogout={logout} />
          <main className="flex-1 p-8 overflow-auto bg-white">{children}</main>
        </div>
      </div>
    </PermissionProvider>
  );
}
