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

export function DashboardWrapper({
  children,
  userRole,
  permissions,
}: DashboardWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <PermissionProvider role={userRole} permissions={permissions}>
      <div className="min-h-screen bg-background text-foreground flex h-screen overflow-hidden">
        {/* Mobile Sidebar backdrop overlay */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-all duration-300"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        <Sidebar
          onLogout={logout}
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
          userRole={userRole}
          permissions={permissions}
          mobileOpen={isMobileOpen}
          onMobileClose={() => setIsMobileOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0 h-full transition-all duration-300 ease-in-out">
          <Topbar
            onLogout={logout}
            onToggleMobile={() => setIsMobileOpen(!isMobileOpen)}
          />
          <main className="flex-1 p-4 md:p-6 overflow-auto bg-muted/20 text-foreground">
            {children}
          </main>
        </div>
      </div>
    </PermissionProvider>
  );
}
