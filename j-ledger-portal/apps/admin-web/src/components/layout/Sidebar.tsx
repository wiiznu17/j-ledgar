'use client';

import {
  Activity,
  AlertTriangle,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Send,
  ShieldCheck,
  Users,
  LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
}

interface SidebarProps {
  onLogout: (formData: FormData) => void;
  isCollapsed?: boolean;
  userRole?: string;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: Activity },
  {
    name: 'AML Monitor',
    href: '/aml',
    icon: AlertTriangle,
    roles: ['SUPER_ADMIN', 'COMPLIANCE_OFFICER'],
  },
  {
    name: 'Accounts',
    href: '/accounts',
    icon: CreditCard,
    roles: ['SUPER_ADMIN', 'SUPPORT_STAFF'],
  },
  { name: 'System Outbox', href: '/system/outbox', icon: Send },
  { name: 'Reconcile', href: '/reconcile', icon: ShieldCheck },
  {
    name: 'Audit Logs',
    href: '/audit',
    icon: FileText,
    roles: ['SUPER_ADMIN', 'AUDITOR'],
  },
  { name: 'Users', href: '/users', icon: Users, roles: ['SUPER_ADMIN'] },
  {
    name: 'Admins',
    href: '/system/admins',
    icon: ShieldCheck,
    roles: ['SUPER_ADMIN'],
  },
];

export function Sidebar({
  onLogout,
  isCollapsed = false,
  userRole = 'SUPPORT_STAFF',
}: SidebarProps) {
  const pathname = usePathname();
  return (
    <aside
      className={`bg-gradient-to-b from-[#E0F2FE] via-white to-[#FCE7F3] border-r border-border flex-col hidden lg:flex h-full transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div
        className={`h-16 flex items-center border-b border-border/50 flex-shrink-0 transition-all duration-300 ${
          isCollapsed ? 'justify-center px-0' : 'px-6'
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--color-magenta)] to-[var(--color-pink)] flex items-center justify-center shadow-md flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        {!isCollapsed && (
          <span className="ml-3 text-xl font-bold text-slate-800 animate-in fade-in duration-500">
            J-Ledger
          </span>
        )}
      </div>

      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          if (item.roles && !item.roles.includes(userRole)) return null;

          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : ''}
              className={`flex items-center rounded-xl transition-all duration-200 group ${
                isCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'
              } ${
                isActive
                  ? 'bg-gradient-to-r from-[#BFDBFE] to-[#E9D5FF] text-slate-800 shadow-[0_4px_0_0_#A5B4FC] border-t border-[#FFFFFF/60]'
                  : 'text-slate-600 hover:bg-slate-500/10 hover:text-slate-900'
              }`}
            >
              <item.icon
                className={`flex-shrink-0 transition-colors ${
                  isCollapsed ? 'h-6 w-6' : 'mr-3 h-5 w-5'
                } ${isActive ? 'text-slate-800' : 'text-slate-500 group-hover:text-slate-900'}`}
                aria-hidden="true"
              />
              {!isCollapsed && (
                <span className="text-sm font-semibold truncate animate-in fade-in slide-in-from-left-2 duration-300">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div
        className={`p-4 border-t border-border/50 flex-shrink-0 transition-all duration-300 ${
          isCollapsed ? 'flex justify-center' : ''
        }`}
      >
        <form action={onLogout} className="w-full">
          <Button
            type="submit"
            variant="ghost"
            className={`text-slate-600 hover:bg-slate-500/5 hover:text-slate-900 w-full transition-all ${
              isCollapsed ? 'px-0 justify-center' : 'justify-start'
            }`}
          >
            <LogOut
              className={`flex-shrink-0 ${isCollapsed ? 'h-6 w-6' : 'mr-3 w-5 h-5 text-slate-500'}`}
            />
            {!isCollapsed && <span className="font-semibold text-sm">Sign out</span>}
          </Button>
        </form>
      </div>
    </aside>
  );
}
