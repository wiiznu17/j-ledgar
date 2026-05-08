'use client';

import { LogOut, User, Settings, ChevronDown, UserCircle } from 'lucide-react';
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
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

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
    const match = Object.keys(routeTitles).find(route => pathname.startsWith(route));
    return match ? routeTitles[match] : 'P-wallet Admin';
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
        
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                  <UserCircle className="w-7 h-7" />
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-xs font-bold text-slate-800 leading-tight">{user.firstName} {user.lastName}</span>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">{user.role}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-1 rounded-2xl border-slate-100 shadow-2xl p-2 bg-white">
              <DropdownMenuLabel className="px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Authenticated Account</span>
                  <span className="text-sm font-bold text-slate-900 truncate">{user.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-50 my-1" />
              <DropdownMenuItem asChild className="rounded-xl focus:bg-indigo-50 focus:text-indigo-600 py-2.5 cursor-pointer">
                <Link href="/system/profile" className="flex items-center w-full">
                  <User className="w-4 h-4 mr-3 text-slate-400 group-focus:text-indigo-600" />
                  <span className="font-semibold text-xs">My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl focus:bg-indigo-50 focus:text-indigo-600 py-2.5 cursor-pointer">
                <Settings className="w-4 h-4 mr-3 text-slate-400" />
                <span className="font-semibold text-xs">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-50 my-1" />
              {onLogout && (
                <form action={onLogout}>
                  <button type="submit" className="flex items-center w-full px-2 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left group">
                    <LogOut className="w-4 h-4 mr-3 text-rose-400 group-hover:text-rose-600" />
                    <span className="font-bold text-xs">Sign out</span>
                  </button>
                </form>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" />
        )}
      </div>
    </header>
  );
}
