'use client';

import { LogOut, User, Settings, ChevronDown, UserCircle, Menu } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authRequester } from '@/lib/requesters';
import { AdminUser } from '@repo/dto';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

interface TopbarProps {
  onLogout?: (formData: FormData) => void;
  onToggleMobile?: () => void;
}

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/promotions/deals': 'Deals',
  '/promotions/banners': 'Banners',
  '/promotions/redemptions': 'Redemptions',
  '/aml': 'AML Monitor',
  '/wallets': 'Customer Wallets',
  '/system/ledger': 'Internal Ledger',
  '/kyc': 'KYC Verification',
  '/system/outbox': 'System Outbox',
  '/reconcile': 'Reconcile',
  '/audit': 'Audit Logs',
  '/users': 'Users',
  '/users/activity': 'User Activity',
  '/system/admins': 'Admins',
};

export function Topbar({ onLogout, onToggleMobile }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await authRequester.getMe();
        setUser(data);
      } catch (e) {
        console.error('Failed to fetch user in Topbar', e);
      }
    };
    fetchUser();
  }, []);

  // Find the exact match or the closest parent route match
  const getPageTitle = () => {
    if (routeTitles[pathname]) return routeTitles[pathname];
    const match = Object.keys(routeTitles).find((route) =>
      pathname.startsWith(route),
    );
    return match ? routeTitles[match] : 'P-wallet Admin';
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-8 flex-shrink-0 text-foreground transition-colors duration-200">
      <div className="flex items-center gap-2 md:gap-4">
        {onToggleMobile && (
          <button
            onClick={onToggleMobile}
            className="p-2 -ml-2 rounded-lg lg:hidden text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-lg md:text-xl font-black text-foreground tracking-tight">
          {getPageTitle()}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-muted transition-all border border-transparent hover:border-border group">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground overflow-hidden">
                  <UserCircle className="w-7 h-7" />
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-xs font-bold text-foreground leading-tight">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">
                    {user.role}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 mt-1 rounded-2xl border-border shadow-2xl p-2 bg-card text-foreground"
            >
              <DropdownMenuLabel className="px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">
                    Authenticated Account
                  </span>
                  <span className="text-sm font-bold text-foreground truncate">
                    {user.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/60 my-1" />
              <DropdownMenuItem
                asChild
                className="rounded-xl focus:bg-indigo-500/10 focus:text-indigo-500 dark:focus:bg-indigo-500/20 dark:focus:text-indigo-400 py-2.5 cursor-pointer"
              >
                <Link
                  href="/system/profile"
                  className="flex items-center w-full"
                >
                  <User className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span className="font-semibold text-xs">My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl focus:bg-indigo-500/10 focus:text-indigo-500 dark:focus:bg-indigo-500/20 dark:focus:text-indigo-400 py-2.5 cursor-pointer">
                <Settings className="w-4 h-4 mr-3 text-muted-foreground" />
                <span className="font-semibold text-xs">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/60 my-1" />
              {onLogout && (
                <form action={onLogout}>
                  <button
                    type="submit"
                    className="flex items-center w-full px-2 py-2.5 text-rose-600 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-xl transition-colors text-left group cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-3 text-rose-400 group-hover:text-rose-600" />
                    <span className="font-bold text-xs">Sign out</span>
                  </button>
                </form>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
        )}
      </div>
    </header>
  );
}
