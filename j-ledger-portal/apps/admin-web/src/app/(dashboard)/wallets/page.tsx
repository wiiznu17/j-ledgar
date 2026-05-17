'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Wallet,
  ShieldAlert,
  ShieldCheck,
  MoreHorizontal,
  ArrowRight,
} from 'lucide-react';
import { walletRequester } from '@/lib/requesters/walletRequester';
import { WalletDto } from '@repo/dto';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  FilterSearchInput,
  FilterSelect,
  FilterActions,
} from '@/components/common/FilterElements';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TablePagination } from '@/components/common/TablePagination';

export default function WalletAccountsPage() {
  const [wallets, setWallets] = useState<WalletDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userRole, setUserRole] = useState('SUPPORT_STAFF');

  // Filter Inputs
  const [searchInput, setSearchInput] = useState('');
  const [statusInput, setStatusInput] = useState('ALL');

  // Applied Filters
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('ALL');

  useEffect(() => {
    const role = document.cookie
      .split('; ')
      .find((row) => row.startsWith('user_role='))
      ?.split('=')[1];
    if (role) setUserRole(role);
  }, []);

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await walletRequester.getWallets({
        page: page - 1,
        size: 10,
      });

      // Filter client-side if search is used (since Java search is simplified)
      let filteredData = response.data;
      if (appliedSearch) {
        filteredData = filteredData.filter(
          (w: WalletDto) =>
            w.walletId.toLowerCase().includes(appliedSearch.toLowerCase()) ||
            w.userId.toLowerCase().includes(appliedSearch.toLowerCase()),
        );
      }

      if (appliedStatus !== 'ALL') {
        filteredData = filteredData.filter(
          (w: WalletDto) => w.status === appliedStatus,
        );
      }

      setWallets(filteredData);
      setTotal(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('[WALLET_ACCOUNTS] Fetch error:', error);
      toast.error('Failed to fetch wallet accounts');
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch, appliedStatus]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchInput);
    setAppliedStatus(statusInput);
    setPage(1);
  };

  const handleReset = () => {
    setSearchInput('');
    setStatusInput('ALL');
    setAppliedSearch('');
    setAppliedStatus('ALL');
    setPage(1);
  };

  const handleToggleFreeze = async (wallet: WalletDto) => {
    const isFrozen = wallet.status === 'FROZEN';
    const action = isFrozen ? 'unfreeze' : 'freeze';

    try {
      if (isFrozen) {
        await walletRequester.unfreezeWallet(wallet.userId);
        toast.success(`Wallet ${wallet.walletId} has been unfrozen`);
      } else {
        await walletRequester.freezeWallet(wallet.userId);
        toast.error(`Wallet ${wallet.walletId} has been frozen`, {
          icon: <ShieldAlert className="w-4 h-4 text-rose-500" />,
        });
      }
      fetchWallets();
    } catch (error) {
      toast.error(`Failed to ${action} wallet`);
    }
  };

  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  return (
    <div className="space-y-6 pb-10 text-foreground">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg">
              <Wallet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Customer Wallets
            </h2>
          </div>
          <p className="text-muted-foreground">
            Monitor and manage all user wallets and their financial states.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="bg-muted border-border text-muted-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
          >
            Total Wallets: {total}
          </Badge>
        </div>
      </div>

      <Card className="border-none shadow-xs overflow-hidden bg-card text-card-foreground">
        {/* Filter Toolbar */}
        <div className="p-4 bg-card border-b border-border">
          <form
            onSubmit={handleApplyFilter}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
          >
            <FilterSearchInput
              label="Search Wallet / User"
              placeholder="W-XXXXXX or UUID"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />

            <FilterSelect
              label="Account Status"
              value={statusInput}
              onValueChange={(v: string) => setStatusInput(v || 'ALL')}
              options={[
                { label: 'ALL STATUS', value: 'ALL' },
                { label: 'ACTIVE', value: 'ACTIVE' },
                { label: 'FROZEN', value: 'FROZEN' },
                { label: 'INACTIVE', value: 'INACTIVE' },
              ]}
            />

            <FilterActions
              searchLabel="Apply Filters"
              isLoading={loading}
              onReset={handleReset}
              className="md:col-span-2"
            />
          </form>
        </div>

        {/* Table Content */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[60px] text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-6">
                    No.
                  </TableHead>
                  <TableHead className="w-[180px] text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Wallet ID
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Owner (User ID)
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right">
                    Balance
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">
                    Status
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right">
                    Last Updated
                  </TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse border-border">
                      <TableCell colSpan={7} className="h-16 bg-muted/20" />
                    </TableRow>
                  ))
                ) : wallets.length > 0 ? (
                  wallets.map((wallet, index) => (
                    <TableRow
                      key={wallet.id}
                      className="border-border hover:bg-muted/50 transition-colors group"
                    >
                      <TableCell className="pl-6 text-xs font-bold text-muted-foreground tabular-nums">
                        {(page - 1) * 10 + index + 1}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        <Link
                          href={`/wallets/${wallet.id}`}
                          className="hover:underline underline-offset-4"
                        >
                          {wallet.walletId}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span
                            className="text-xs font-mono text-muted-foreground truncate w-40"
                            title={wallet.userId}
                          >
                            {wallet.userId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            'font-bold tabular-nums',
                            wallet.balance > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-foreground',
                          )}
                        >
                          {wallet.balance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="ml-1 text-[10px] font-bold text-muted-foreground">
                          {wallet.currency}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={cn(
                            'rounded-lg px-2 py-0.5 text-[10px] font-bold border-none',
                            wallet.status === 'ACTIVE' &&
                              'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20',
                            wallet.status === 'FROZEN' &&
                              'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20',
                            wallet.status === 'INACTIVE' &&
                              'bg-muted text-muted-foreground hover:bg-muted',
                          )}
                        >
                          {wallet.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(wallet.updatedAt).toLocaleDateString()}{' '}
                        {new Date(wallet.updatedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Popover>
                            <PopoverTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                              <MoreHorizontal className="h-4 w-4" />
                            </PopoverTrigger>
                            <PopoverContent
                              align="end"
                              className="w-48 p-2 border-border shadow-xl bg-card text-card-foreground"
                            >
                              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 py-2">
                                Management
                              </div>
                              <div className="h-px bg-border my-1" />
                              <Link
                                href={`/wallets/${wallet.id}`}
                                className="flex items-center w-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                              >
                                <Search className="w-4 h-4 mr-2 text-muted-foreground" />{' '}
                                View Detail
                              </Link>

                              {isSuperAdmin && (
                                <>
                                  <div className="h-px bg-border my-1" />
                                  <button
                                    className={cn(
                                      'flex items-center w-full px-3 py-2 text-sm font-bold rounded-lg transition-colors',
                                      wallet.status === 'FROZEN'
                                        ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                                        : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10',
                                    )}
                                    onClick={() => handleToggleFreeze(wallet)}
                                  >
                                    {wallet.status === 'FROZEN' ? (
                                      <>
                                        <ShieldCheck className="w-4 h-4 mr-2" />{' '}
                                        Unfreeze Wallet
                                      </>
                                    ) : (
                                      <>
                                        <ShieldAlert className="w-4 h-4 mr-2" />{' '}
                                        Freeze Wallet
                                      </>
                                    )}
                                  </button>
                                </>
                              )}
                            </PopoverContent>
                          </Popover>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Wallet className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-sm font-medium">
                          No wallet accounts found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            onPageChange={setPage}
            isLoading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
