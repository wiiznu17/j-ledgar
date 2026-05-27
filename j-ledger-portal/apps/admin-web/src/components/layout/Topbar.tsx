'use client';

import {
  LogOut,
  User,
  Settings,
  ChevronDown,
  UserCircle,
  Menu,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
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
import { MenuSearch } from '@/components/layout/MenuSearch';

interface TopbarProps {
  onLogout?: (formData: FormData) => void;
  onToggleMobile?: () => void;
}

interface RouteMeta {
  pattern: string;
  title: string;
  description: string;
}

const routeMetas: RouteMeta[] = [
  {
    pattern: '/dashboard',
    title: 'Dashboard',
    description: 'Overview of system performance and key metrics',
  },
  {
    pattern: '/transactions/[id]',
    title: 'Transaction Details',
    description: 'Inspect transaction status, routing metadata, and ledger context.',
  },
  {
    pattern: '/transactions',
    title: 'Transactions',
    description: 'Search, filter, and review customer payment activity across the platform.',
  },
  {
    pattern: '/promotions/deals/new',
    title: 'Create Deal',
    description: 'Configure a new promotion campaign, eligibility rules, and reward mechanics.',
  },
  {
    pattern: '/promotions/deals/[id]/edit',
    title: 'Edit Deal',
    description: 'Update promotion details, targeting, budget, and campaign lifecycle controls.',
  },
  {
    pattern: '/promotions/deals/[id]',
    title: 'Deal Details',
    description: 'Review campaign configuration, redemption performance, and operational status.',
  },
  {
    pattern: '/promotions/deals',
    title: 'Deals & Coupons',
    description: 'Manage promotional offers, coupon campaigns, and customer reward incentives.',
  },
  {
    pattern: '/promotions/deals/simulator',
    title: 'Deal Simulator',
    description: 'Test promotion eligibility and reward outcomes before launching campaigns.',
  },
  {
    pattern: '/promotions/banners',
    title: 'Banners',
    description: 'Manage in-app promotional banners, placements, and visibility windows.',
  },
  {
    pattern: '/promotions/redemptions',
    title: 'Redemptions',
    description: 'Track customer reward usage, coupon claims, and redemption outcomes.',
  },
  {
    pattern: '/promotions/settings',
    title: 'Promotion Settings',
    description: 'Tune global promotion behavior, campaign controls, and operational defaults.',
  },
  {
    pattern: '/promotions/loyalty',
    title: 'Loyalty Program',
    description: 'Configure points, tiers, earning rules, and loyalty engagement controls.',
  },
  {
    pattern: '/risk/kyc/[userId]',
    title: 'KYC Details',
    description: 'Review customer identity evidence, verification history, and decision context.',
  },
  {
    pattern: '/risk/kyc',
    title: 'KYC Verification',
    description: 'Review identity applications, verification outcomes, and pending compliance checks.',
  },
  {
    pattern: '/risk/aml',
    title: 'AML Monitor',
    description: 'Investigate suspicious activity, risk scoring, and regulatory review workflows.',
  },
  {
    pattern: '/risk/fraud',
    title: 'Fraud Alerts',
    description: 'Monitor sophisticated patterns such as smurfing, structuring, layering, and ledger account takeoff threats.',
  },
  {
    pattern: '/risk/blacklist',
    title: 'Blacklist Management',
    description: 'Restrict wallets, block compromised IP ranges, and revoke unauthorized hardware keys instantly.',
  },
  {
    pattern: '/finance/wallets/[id]',
    title: 'Wallet Details',
    description: 'Inspect wallet balances, linked customer records, and account-level activity.',
  },
  {
    pattern: '/finance/wallets',
    title: 'Customer Wallets',
    description: 'Monitor wallet status, balances, and customer account controls.',
  },
  {
    pattern: '/finance/reconcile',
    title: 'Reconcile',
    description: 'Compare internal records, settlement files, and ledger consistency signals.',
  },
  {
    pattern: '/finance/settlement',
    title: 'Merchant Settlement',
    description: 'Clear pending balances to merchant bank accounts, deduct transaction fees, and update ledger balances.',
  },
  {
    pattern: '/finance/treasury',
    title: 'System Treasury',
    description: 'Monitor platform liquidity, treasury balances, and funding movement controls.',
  },
  {
    pattern: '/finance/ledger/[id]',
    title: 'Ledger Transaction Details',
    description: 'Trace double-entry postings, ledger impact, and transaction audit context.',
  },
  {
    pattern: '/finance/ledger',
    title: 'Internal Ledger',
    description: 'Browse ledger entries, posting history, and accounting movement records.',
  },
  {
    pattern: '/audit',
    title: 'Audit Logs',
    description: 'Review administrative actions, security events, and operational audit trails.',
  },
  {
    pattern: '/reports',
    title: 'Reports',
    description: 'Generate operational, finance, risk, and growth summaries for stakeholders.',
  },
  {
    pattern: '/support/user-activity',
    title: 'User Activity',
    description: 'Trace customer login events, device activity, and security-sensitive actions.',
  },
  {
    pattern: '/support/devices',
    title: 'User Devices',
    description: 'Monitor trusted devices, session keys, and revoke compromised user terminals.',
  },
  {
    pattern: '/support/disputes',
    title: 'Disputes',
    description: 'Manage customer disputes, evidence review, and case resolution workflows.',
  },
  {
    pattern: '/support/users/[id]',
    title: 'User Details',
    description: 'Inspect customer profile, wallets, verification state, and support history.',
  },
  {
    pattern: '/support/users',
    title: 'Users',
    description: 'Search wallet users, review account status, and support customer operations.',
  },
  {
    pattern: '/support/merchants/applications',
    title: 'Merchant Applications',
    description: 'Review merchant onboarding submissions, KYC evidence, and approval readiness.',
  },
  {
    pattern: '/support/merchants/create',
    title: 'Create Partner',
    description: 'Register a new merchant partner and configure operational account details.',
  },
  {
    pattern: '/support/merchants/[id]/edit',
    title: 'Edit Merchant',
    description: 'Update merchant profile, settlement configuration, and operational metadata.',
  },
  {
    pattern: '/support/merchants/[id]/terminals',
    title: 'Merchant Terminals',
    description: 'Manage merchant POS terminals, device bindings, and terminal activation state.',
  },
  {
    pattern: '/support/merchants/[id]',
    title: 'Merchant Details',
    description: 'Review merchant profile, settlement health, terminals, and activity history.',
  },
  {
    pattern: '/support/merchants',
    title: 'Merchants',
    description: 'Manage merchant partners, onboarding status, and operational account controls.',
  },
  {
    pattern: '/system/profile',
    title: 'My Profile',
    description: 'View your admin account details, role assignment, and access context.',
  },
  {
    pattern: '/system/admins/[id]',
    title: 'Admin Details',
    description: 'Inspect administrator profile, role grants, and account status.',
  },
  {
    pattern: '/system/admins',
    title: 'Admin Management',
    description: 'Manage administrator accounts, role assignments, and staff access controls.',
  },
  {
    pattern: '/system/roles/[id]',
    title: 'Role Details',
    description: 'Review role permissions, access scope, and assigned administrator coverage.',
  },
  {
    pattern: '/system/roles',
    title: 'Role Management',
    description: 'Configure admin roles, permissions, and least-privilege access policies.',
  },
  {
    pattern: '/system/approvals',
    title: 'System Approvals',
    description: 'Review pending administrative approvals and sensitive workflow decisions.',
  },
  {
    pattern: '/system/outbox',
    title: 'System Outbox',
    description: 'Monitor queued notifications, delivery attempts, and outbound message status.',
  },
  {
    pattern: '/system/settings',
    title: 'System Settings',
    description: 'Adjust platform-wide configuration, feature controls, and operational defaults.',
  },
];

const matchRoute = (pathname: string, pattern: string) => {
  const pathParts = pathname.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);

  if (pathParts.length !== patternParts.length) return false;

  return patternParts.every((part, i) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      return true; // Match Dynamic Parameter
    }
    return part === pathParts[i];
  });
};

export function Topbar({ onLogout, onToggleMobile }: TopbarProps) {
  const pathname = usePathname();
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

  const getPageMeta = () => {
    const exactMatch = routeMetas.find((r) => r.pattern === pathname);
    if (exactMatch) return exactMatch;

    const dynamicMatch = routeMetas.find((r) =>
      matchRoute(pathname, r.pattern),
    );
    if (dynamicMatch) return dynamicMatch;

    return {
      title: 'P-wallet Admin',
      description: 'Manage platform operations, risk controls, and customer support workflows.',
    };
  };

  const pageMeta = getPageMeta();

  return (
    <header className="h-16 md:h-[72px] bg-card border-b border-border flex items-center justify-between px-4 md:px-8 flex-shrink-0 text-foreground transition-all duration-200">
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

        {/* Title and Subtitle block */}
        <div className="flex flex-col justify-center">
          <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight leading-tight">
            {pageMeta.title}
          </h1>
          <span className="text-[11px] font-medium text-muted-foreground mt-0.5 hidden sm:inline">
            {pageMeta.description}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Real Interactive Menu Search */}
        <MenuSearch />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Admin Account Profile Dropdown */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-muted transition-all border border-transparent hover:border-border group cursor-pointer">
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
