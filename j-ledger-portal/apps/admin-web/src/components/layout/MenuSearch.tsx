'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Activity,
  Landmark,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  Ticket,
  Image as ImageIcon,
  ClipboardList,
  Settings,
  Coins,
  Users,
  Store,
  History,
  Database,
  Send,
  User,
  PlusCircle,
  Search,
  CornerDownLeft,
} from 'lucide-react';
import { Permission } from '@repo/dto';
import { usePermissions } from '@/components/auth/PermissionContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface SearchItem {
  name: string;
  category: string;
  href: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission?: Permission;
  isSoon?: boolean;
  roles?: string[];
}

const searchItems: SearchItem[] = [
  // Overview
  {
    name: 'Dashboard',
    category: 'Overview',
    href: '/dashboard',
    description: 'System overview, VAT settlements, and real-time financial stats.',
    icon: LayoutDashboard,
  },
  {
    name: 'Transactions Log',
    category: 'Overview',
    href: '/transactions',
    description: 'Real-time ledger transactions and money transfer logs.',
    icon: Activity,
  },

  // Finance & Accounting
  {
    name: 'System Treasury',
    category: 'Finance & Accounting',
    href: '/finance/treasury',
    description: 'Monitor reserve ratios, stripe bank accounts, and payouts.',
    icon: Landmark,
    requiredPermission: Permission.VIEW_TRANSACTIONS,
  },
  {
    name: 'Customer Wallets',
    category: 'Finance & Accounting',
    href: '/finance/wallets',
    description: 'Check wallet balances, daily/monthly limits, and freeze status.',
    icon: Wallet,
    requiredPermission: Permission.VIEW_USERS,
  },
  {
    name: 'Internal Ledger',
    category: 'Finance & Accounting',
    href: '/finance/ledger',
    description: 'View double-entry accounts ledger logs and credit/debit records.',
    icon: Landmark,
    requiredPermission: Permission.VIEW_LEDGER_ENTRIES,
  },
  {
    name: 'Reconciliation',
    category: 'Finance & Accounting',
    href: '/finance/reconcile',
    description: 'Match asset/liability entries and download reconciliation reports.',
    icon: ShieldCheck,
    requiredPermission: Permission.RUN_RECONCILIATION,
  },

  // Risk & Compliance
  {
    name: 'KYC Verification',
    category: 'Risk & Compliance',
    href: '/risk/kyc',
    description: 'Verify user registration data, ID cards, and address details.',
    icon: ShieldCheck,
    requiredPermission: Permission.VIEW_USERS,
  },
  {
    name: 'AML Monitor',
    category: 'Risk & Compliance',
    href: '/risk/aml',
    description: 'Monitor suspicious transaction scores and AML warnings.',
    icon: AlertTriangle,
    requiredPermission: Permission.VIEW_SUSPICIOUS_ACTIVITIES,
    isSoon: true,
  },

  // Promotions
  {
    name: 'Deals & Coupons',
    category: 'Promotions',
    href: '/promotions/deals',
    description: 'Manage merchant deals, brand partners, and discount coupons.',
    icon: Ticket,
    requiredPermission: Permission.VIEW_DEALS,
  },
  {
    name: 'Banners',
    category: 'Promotions',
    href: '/promotions/banners',
    description: 'Design and schedule promotional banners for the wallet app.',
    icon: ImageIcon,
    requiredPermission: Permission.VIEW_BANNERS,
  },
  {
    name: 'Redemptions',
    category: 'Promotions',
    href: '/promotions/redemptions',
    description: 'Audit customer point redemptions and coupon claims history.',
    icon: ClipboardList,
    requiredPermission: Permission.VIEW_DEALS,
  },
  {
    name: 'Deal Settings',
    category: 'Promotions',
    href: '/promotions/settings',
    description: 'Adjust global validation limits and promotional capping parameters.',
    icon: Settings,
    requiredPermission: Permission.VIEW_DEALS,
  },
  {
    name: 'Loyalty Program Rules',
    category: 'Promotions',
    href: '/promotions/loyalty',
    description: 'Set rules for point multiplier coefficients and point expiration times.',
    icon: Coins,
    requiredPermission: Permission.VIEW_LOYALTY,
  },

  // Support & Operations
  {
    name: 'Users Lookup',
    category: 'Support & Operations',
    href: '/support/users',
    description: 'Search customer information, profile status, and transaction histories.',
    icon: Users,
    requiredPermission: Permission.VIEW_USERS,
  },
  {
    name: 'Merchant Partners',
    category: 'Support & Operations',
    href: '/support/merchants',
    description: 'Manage terminal assignments and partner application requests.',
    icon: Store,
    requiredPermission: Permission.VIEW_MERCHANTS,
  },
  {
    name: 'User Activity (Audit Logs)',
    category: 'Support & Operations',
    href: '/support/user-activity',
    description: 'Inspect staff action history, parameter updates, and system logs.',
    icon: History,
    requiredPermission: Permission.VIEW_AUDIT_LOGS,
  },

  // System & Security
  {
    name: 'System Platform Settings',
    category: 'System & Security',
    href: '/system/settings',
    description: 'Edit global commission fees, merchant MDR, and platform limits.',
    icon: Settings,
    requiredPermission: Permission.VIEW_SYSTEM_SETTINGS,
  },
  {
    name: 'Admin Management',
    category: 'System & Security',
    href: '/system/admins',
    description: 'Add or revoke operational administrative staff members.',
    icon: ShieldCheck,
    requiredPermission: Permission.CREATE_ADMINS,
  },
  {
    name: 'Roles & Permissions',
    category: 'System & Security',
    href: '/system/roles',
    description: 'Create security groups and configure functional role access tables.',
    icon: Database,
    requiredPermission: Permission.MANAGE_SYSTEM_ROLES,
  },
  {
    name: 'System Outbox Message Queue',
    category: 'System & Security',
    href: '/system/outbox',
    description: 'Check Kafka outbox database records and queue delivery failures.',
    icon: Send,
    requiredPermission: Permission.VIEW_SYSTEM_OUTBOX,
  },

  // Quick Actions
  {
    name: 'Create New Deal',
    category: 'Quick Actions',
    href: '/promotions/deals/new',
    description: 'Instantly launch the creation screen for a new coupon deal.',
    icon: PlusCircle,
    requiredPermission: Permission.MANAGE_DEALS,
  },
  {
    name: 'Create Merchant Partner',
    category: 'Quick Actions',
    href: '/support/merchants/create',
    description: 'Add a new merchant profile and registration parameters.',
    icon: PlusCircle,
    requiredPermission: Permission.MANAGE_MERCHANTS,
  },
  {
    name: 'View Merchant Applications',
    category: 'Quick Actions',
    href: '/support/merchants/applications',
    description: 'Evaluate business submissions from potential merchant partners.',
    icon: ClipboardList,
    requiredPermission: Permission.VIEW_MERCHANTS,
  },

  // Account
  {
    name: 'My Profile',
    category: 'Account Settings',
    href: '/system/profile',
    description: 'Review your credentials, operational role, and personal settings.',
    icon: User,
  },
];

export function MenuSearch() {
  const router = useRouter();
  const { permissions, role } = usePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Monitor Global ⌘K / Ctrl+K
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Reset indices on query or open
  useEffect(() => {
    setSelectedIndex(0);
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [searchQuery, isOpen]);

  // Filter items matching user's security level and keyword
  const filtered = searchItems.filter((item) => {
    const rolePass = !item.roles || item.roles.includes(role);
    const permissionPass =
      !item.requiredPermission || permissions.includes(item.requiredPermission);
    if (!rolePass || !permissionPass) return false;

    if (!searchQuery) return true;
    const cleanQuery = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(cleanQuery) ||
      item.category.toLowerCase().includes(cleanQuery) ||
      item.description.toLowerCase().includes(cleanQuery)
    );
  });

  const handleNavigate = (item: SearchItem) => {
    if (item.isSoon) return;
    setIsOpen(false);
    setSearchQuery('');
    router.push(item.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleNavigate(filtered[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  let lastCategory = '';

  return (
    <>
      {/* Desktop Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden lg:flex items-center bg-slate-50 dark:bg-slate-900 border border-border/80 rounded-xl px-3 py-1.5 gap-2 w-64 text-muted-foreground/80 hover:border-muted-foreground/30 hover:bg-muted/30 transition-all shadow-2xs hover:shadow-xs group cursor-pointer text-left focus:outline-hidden"
      >
        <Search className="w-4 h-4 text-muted-foreground/75 group-hover:text-foreground transition-colors" />
        <span className="text-xs font-semibold flex-1">Search menus & pages...</span>
        <kbd className="text-[9px] font-bold bg-background dark:bg-muted/80 border border-border px-1.5 py-0.5 rounded shadow-2xs text-muted-foreground/60 select-none group-hover:bg-muted transition-colors">⌘K</kbd>
      </button>

      {/* Mobile/Tablet Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all border border-transparent hover:border-border cursor-pointer shrink-0"
        aria-label="Search"
      >
        <Search className="w-4.5 h-4.5" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="max-w-xl p-0 overflow-hidden bg-card border border-border shadow-2xl rounded-2xl sm:max-w-xl"
          showCloseButton={false}
        >
          {/* Header Input */}
          <div className="flex items-center border-b border-border/60 px-4 py-3 gap-3 bg-muted/20">
            <Search className="w-4.5 h-4.5 text-muted-foreground/80" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search admin menus, actions, and settings..."
              className="flex-1 bg-transparent border-0 outline-hidden text-sm placeholder:text-muted-foreground/60 focus:ring-0 text-foreground"
              autoFocus
            />
            <kbd className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-muted-foreground border border-border px-1.5 py-0.5 rounded select-none">ESC</kbd>
          </div>

          {/* Search Results */}
          <div
            ref={listRef}
            className="max-h-[380px] overflow-y-auto p-2 custom-scrollbar space-y-1"
          >
            {filtered.length > 0 ? (
              filtered.map((item, index) => {
                const showHeader = item.category !== lastCategory;
                lastCategory = item.category;
                const isSelected = index === selectedIndex;

                return (
                  <div key={item.href + '-' + item.name}>
                    {showHeader && (
                      <div className="px-3 py-2 text-[10px] font-black text-muted-foreground/60 tracking-wider uppercase select-none mt-2 first:mt-1">
                        {item.category}
                      </div>
                    )}
                    <button
                      onClick={() => handleNavigate(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      data-active={isSelected}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left select-none outline-hidden cursor-pointer border border-transparent',
                        isSelected
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shadow-xs dark:bg-indigo-500/20'
                          : item.isSoon
                            ? 'text-muted-foreground/30 opacity-50 cursor-not-allowed'
                            : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          className={cn(
                            'w-4 h-4 shrink-0',
                            isSelected
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-muted-foreground/60',
                          )}
                        />
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={cn(
                              'text-xs font-bold leading-none',
                              isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-foreground',
                            )}
                          >
                            {item.name}
                          </span>
                          <span className="text-[10.5px] leading-snug text-muted-foreground/80 font-medium line-clamp-1">
                            {item.description}
                          </span>
                        </div>
                      </div>

                      {/* Indicator tag */}
                      {isSelected && !item.isSoon && (
                        <div className="flex items-center gap-1 text-[10px] font-black bg-indigo-500/10 dark:bg-indigo-500/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-md border border-indigo-500/10">
                          <span>GO</span>
                          <CornerDownLeft className="w-3 h-3" />
                        </div>
                      )}

                      {item.isSoon && (
                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 border border-border bg-slate-100 dark:bg-slate-800 rounded px-1 py-0.5 uppercase tracking-tighter select-none">
                          SOON
                        </span>
                      )}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-12 px-4 text-center select-none animate-in fade-in duration-300">
                <p className="text-sm font-bold text-muted-foreground">No menu items found</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">
                  Try checking your spelling or typing another keyword.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
