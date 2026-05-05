'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface TopbarProps {
  onLogout?: (formData: FormData) => void;
}

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/promotions/deals': 'Deals',
  '/promotions/banners': 'Banners',
  '/promotions/redemptions': 'Redemptions',
  '/aml': 'AML Monitor',
  '/accounts': 'Accounts',
  '/kyc': 'KYC Verification',
  '/system/outbox': 'System Outbox',
  '/reconcile': 'Reconcile',
  '/audit': 'Audit Logs',
  '/users': 'Users',
  '/users/activity': 'User Activity',
  '/system/admins': 'Admins',
};

export function Topbar({ onLogout }: TopbarProps) {
  const pathname = usePathname();
  
  // Find the exact match or the closest parent route match
  const getPageTitle = () => {
    if (routeTitles[pathname]) return routeTitles[pathname];
    const match = Object.keys(routeTitles).find(route => pathname.startsWith(route));
    return match ? routeTitles[match] : 'J-Ledger Admin';
  };

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between pl-8 pr-8 flex-shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-black text-slate-800 tracking-tight">
          {getPageTitle()}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {onLogout && (
          <form action={onLogout}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-red-600 hover:bg-red-50 flex items-center gap-2 font-semibold"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </form>
        )}
      </div>
    </header>
  );
}
