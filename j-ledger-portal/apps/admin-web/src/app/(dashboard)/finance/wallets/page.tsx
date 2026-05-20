'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  ArrowRight,
  Copy,
  Check,
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
import { TablePagination } from '@/components/common/TablePagination';

export default function WalletAccountsPage() {
  const router = useRouter();
  const [wallets, setWallets] = useState<WalletDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userRole, setUserRole] = useState('SUPPORT_STAFF');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success('Copied User ID to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

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

      const safeData = Array.isArray(response?.data) ? response.data : [];
      const safePagination = response?.pagination ?? {
        total: safeData.length,
        totalPages: 1,
      };

      // Filter client-side if search is used (since Java search is simplified)
      let filteredData = safeData;
      if (appliedSearch) {
        filteredData = filteredData.filter(
          (w: WalletDto) =>
            (w.walletId || '')
              .toLowerCase()
              .includes(appliedSearch.toLowerCase()) ||
            (w.userId || '')
              .toLowerCase()
              .includes(appliedSearch.toLowerCase()),
        );
      }

      if (appliedStatus !== 'ALL') {
        filteredData = filteredData.filter(
          (w: WalletDto) => w.status === appliedStatus,
        );
      }

      setWallets(filteredData);
      setTotal(
        typeof safePagination.total === 'number'
          ? safePagination.total
          : filteredData.length,
      );
      setTotalPages(
        typeof safePagination.totalPages === 'number' &&
          safePagination.totalPages > 0
          ? safePagination.totalPages
          : 1,
      );
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

  return (
    <div className="space-y-6 pb-10 text-foreground">
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse border-border">
                      <TableCell colSpan={6} className="h-16 bg-muted/20" />
                    </TableRow>
                  ))
                ) : wallets.length > 0 ? (
                  wallets.map((wallet, index) => (
                    <TableRow
                      key={wallet.id}
                      onClick={() =>
                        router.push(`/finance/wallets/${wallet.id}`)
                      }
                      className="border-border hover:bg-muted/50 transition-colors group cursor-pointer"
                    >
                      <TableCell className="pl-6 text-xs font-bold text-muted-foreground tabular-nums">
                        {(page - 1) * 10 + index + 1}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        <span className="hover:underline underline-offset-4">
                          {wallet.walletId}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 group/id">
                          <span
                            className="text-xs font-mono text-muted-foreground truncate w-28"
                            title={wallet.userId}
                          >
                            {wallet.userId}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(wallet.userId);
                            }}
                            className="p-1 rounded-md hover:bg-muted text-muted-foreground/40 hover:text-foreground opacity-0 group-hover/id:opacity-100 transition-all focus:opacity-100 outline-none"
                            title="Copy User ID"
                          >
                            {copiedId === wallet.userId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500 animate-in fade-in zoom-in" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
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
