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
  Ticket,
  Image as ImageIcon,
  ClipboardList,
  Menu,
  Briefcase,
  Landmark,
  SlidersHorizontal,
  ShieldAlert,
  Ban,
  CheckSquare,
  Lock,
  HelpCircle,
  Smartphone,
  BarChart3,
  Search,
  Database,
  History,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
  isNew?: boolean;
  isSoon?: boolean;
}

interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

interface SidebarProps {
  onLogout: (formData: FormData) => void;
  onToggle?: () => void;
  isCollapsed?: boolean;
  userRole?: string;
}

const navigationGroups: NavigationGroup[] = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Transactions', href: '/transactions', icon: Activity },
    ]
  },
  {
    title: 'Finance & Accounting',
    items: [
      { name: 'Treasury', href: '/finance/treasury', icon: Landmark, roles: ['SUPER_ADMIN', 'FINANCE_MANAGER'], isSoon: true },
      { name: 'Settlement', href: '/finance/settlement', icon: Briefcase, roles: ['SUPER_ADMIN', 'FINANCE_MANAGER'], isSoon: true },
      { name: 'Fees & Limits', href: '/finance/fees', icon: SlidersHorizontal, roles: ['SUPER_ADMIN', 'FINANCE_MANAGER'], isSoon: true },
      { name: 'Ledger', href: '/accounts', icon: CreditCard, roles: ['SUPER_ADMIN', 'SUPPORT_STAFF'] },
      { name: 'Reconcile', href: '/reconcile', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'FINANCE_MANAGER'], isSoon: true },
    ]
  },
  {
    title: 'Risk & Compliance',
    items: [
      { name: 'KYC Verification', href: '/kyc', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'SUPPORT_STAFF', 'COMPLIANCE_OFFICER'] },
      { name: 'AML Monitor', href: '/aml', icon: AlertTriangle, roles: ['SUPER_ADMIN', 'COMPLIANCE_OFFICER'], isSoon: true },
      { name: 'Fraud Mgmt', href: '/risk/fraud', icon: ShieldAlert, roles: ['SUPER_ADMIN', 'COMPLIANCE_OFFICER'], isSoon: true },
      { name: 'Blacklist', href: '/risk/blacklist', icon: Ban, roles: ['SUPER_ADMIN', 'COMPLIANCE_OFFICER'], isSoon: true },
    ]
  },
  {
    title: 'Promotions',
    items: [
      { name: 'Deals', href: '/promotions/deals', icon: Ticket, isSoon: true },
      { name: 'Banners', href: '/promotions/banners', icon: ImageIcon, isSoon: true },
      { name: 'Redemptions', href: '/promotions/redemptions', icon: ClipboardList, isSoon: true },
    ]
  },
  {
    title: 'Support & Operations',
    items: [
      { name: 'Users', href: '/users', icon: Users, roles: ['SUPER_ADMIN'] },
      { name: 'User Activity', href: '/users/activity', icon: History, roles: ['SUPER_ADMIN', 'AUDITOR', 'SUPPORT_STAFF'] },
      { name: 'User Devices', href: '/support/devices', icon: Smartphone, roles: ['SUPER_ADMIN', 'SUPPORT_STAFF', 'COMPLIANCE_OFFICER'], isSoon: true },
      { name: 'Disputes', href: '/support/disputes', icon: HelpCircle, roles: ['SUPER_ADMIN', 'SUPPORT_STAFF'], isSoon: true },
    ]
  },
  {
    title: 'System & Security',
    items: [
      { name: 'Approvals', href: '/system/approvals', icon: CheckSquare, roles: ['SUPER_ADMIN', 'FINANCE_MANAGER', 'COMPLIANCE_OFFICER'], isSoon: true },
      { name: 'Security Settings', href: '/system/security', icon: Lock, roles: ['SUPER_ADMIN'], isSoon: true },
      { name: 'Admins', href: '/system/admins', icon: ShieldCheck, roles: ['SUPER_ADMIN'] },
      { name: 'System Outbox', href: '/system/outbox', icon: Send },
    ]
  },
  {
    title: 'Reporting',
    items: [
      { name: 'Audit Logs', href: '/audit', icon: FileText, roles: ['SUPER_ADMIN', 'AUDITOR'] },
      { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'FINANCE_MANAGER', 'AUDITOR'], isSoon: true },
    ]
  }
];

export function Sidebar({
  onLogout,
  onToggle,
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
        className={`h-16 flex items-center justify-between border-b border-border/50 flex-shrink-0 transition-all duration-300 ${
          isCollapsed ? 'px-0 justify-center' : 'px-6'
        }`}
      >
        {!isCollapsed ? (
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--color-magenta)] to-[var(--color-pink)] flex items-center justify-center shadow-md flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="ml-3 text-xl font-bold text-slate-800 animate-in fade-in duration-500">
              J-Ledger
            </span>
          </div>
        ) : null}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-slate-500 hover:text-slate-900 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-8 overflow-y-auto custom-scrollbar text-pretty">
        {navigationGroups.map((group) => {
          // Filter items based on role
          const filteredItems = group.items.filter(item => 
            !item.roles || item.roles.includes(userRole)
          );

          if (filteredItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-2">
              {!isCollapsed && (
                <h3 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {filteredItems.map((item) => {
                  const isActive = 
                    pathname === item.href || 
                    (item.href !== '/' && 
                     pathname.startsWith(item.href + '/') && 
                     !navigationGroups.flatMap(g => g.items).some(other => 
                       other.href !== item.href && 
                       other.href.startsWith(item.href + '/') && 
                       pathname.startsWith(other.href)
                     ));
                  return (
                    <Link
                      key={item.name}
                      href={item.isSoon ? '#' : item.href}
                      title={isCollapsed ? item.name : ''}
                      onClick={(e) => {
                        if (item.isSoon) e.preventDefault();
                      }}
                      className={`flex items-center rounded-xl transition-all duration-200 group ${
                        isCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-2'
                      } ${
                        isActive
                          ? 'bg-gradient-to-r from-[#BFDBFE] to-[#E9D5FF] text-slate-800 shadow-[0_4px_0_0_#A5B4FC] border-t border-[#FFFFFF/60]'
                          : item.isSoon 
                            ? 'text-slate-300 cursor-not-allowed opacity-70'
                            : 'text-slate-600 hover:bg-slate-500/10 hover:text-slate-900'
                      }`}
                    >
                      <item.icon
                        className={`flex-shrink-0 transition-colors ${
                          isCollapsed ? 'h-6 w-6' : 'mr-3 h-4 w-4'
                        } ${isActive ? 'text-slate-800' : item.isSoon ? 'text-slate-200' : 'text-slate-500 group-hover:text-slate-900'}`}
                        aria-hidden="true"
                      />
                      {!isCollapsed && (
                        <div className="flex items-center justify-between flex-1 min-w-0">
                          <span className={cn(
                            "text-sm font-semibold truncate animate-in fade-in slide-in-from-left-2 duration-300",
                            item.isSoon && "text-slate-300"
                          )}>
                            {item.name}
                          </span>
                          {item.isNew && !item.isSoon && (
                            <span className="ml-2 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-[var(--color-magenta)] to-[var(--color-pink)] text-[8px] font-bold text-white tracking-tighter animate-pulse shadow-sm">
                              NEW
                            </span>
                          )}
                          {item.isSoon && (
                            <span className="ml-2 px-1.5 py-0.5 rounded-md bg-slate-100 text-[8px] font-bold text-slate-400 tracking-tighter border border-slate-200 uppercase">
                              SOON
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
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
