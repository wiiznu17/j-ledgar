'use client';

import { Activity, CreditCard, LayoutDashboard, LogOut, Send, ShieldCheck, LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface SidebarProps {
  pathname: string;
  onLogout: (formData: FormData) => void;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: Activity },
  { name: 'Accounts', href: '/accounts', icon: CreditCard },
  { name: 'System Outbox', href: '/system/outbox', icon: Send },
  { name: 'Reconcile', href: '/reconcile', icon: ShieldCheck },
];

export function Sidebar({ pathname, onLogout }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-border flex-col hidden lg:flex h-full">
      <div className="h-16 flex items-center px-6 border-b border-border flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--color-magenta)] to-[var(--color-pink)] mr-3 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-foreground">J-Ledger</span>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-gradient-to-r from-[var(--color-magenta)] to-[var(--color-pink)] text-white'
                  : 'text-foreground hover:bg-secondary'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-accent'}`}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border flex-shrink-0">
        <form action={onLogout}>
          <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-secondary">
            <LogOut className="mr-3 w-5 h-5 text-accent" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
