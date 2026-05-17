'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Landmark,
  ShieldCheck,
  History,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react';
import { accountRequester } from '@/lib/requesters/accountRequester';
import { Account, AdminPaginatedResponse } from '@repo/dto';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TablePagination } from '@/components/common/TablePagination';

export default function InternalLedgerPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await accountRequester.getAccounts({
        page,
        limit: 10,
      });

      setAccounts(response.data as Account[] || []);
      
      if (response.pagination) {
        setTotal(response.pagination.total || 0);
        setTotalPages(response.pagination.totalPages || 1);
      }
    } catch (error) {
      console.error('[INTERNAL_LEDGER] Fetch error:', error);
      toast.error('Failed to fetch internal accounts');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Identify special accounts for UI decoration
  const getAccountLabel = (userId: string) => {
    if (userId === '00000000-0000-0000-0000-000000000000')
      return 'Master Treasury';
    if (userId.includes('reward')) return 'Reward Reserve';
    if (userId.includes('profit')) return 'Platform Revenue';
    return 'Internal Account';
  };

  const getAccountIcon = (userId: string) => {
    if (userId === '00000000-0000-0000-0000-000000000000')
      return <Landmark className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    if (userId.includes('reward'))
      return <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    return <Database className="w-5 h-5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6 pb-10 text-foreground">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg">
              <Landmark className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Internal Ledger
            </h2>
          </div>
          <p className="text-muted-foreground">
            System-level accounting and master treasury management.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="bg-card border-border text-muted-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
          >
            Total Internal Accounts: {total}
          </Badge>
        </div>
      </div>

      <Card className="border-none shadow-xs overflow-hidden bg-card text-card-foreground">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="text-sm font-bold text-foreground">
            Chart of Internal Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[200px] text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-6">
                    Account Identity
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Internal Mapping (User ID)
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right">
                    Balance
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">
                    Status
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right pr-6">
                    Last Transaction
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse border-border">
                      <TableCell colSpan={5} className="h-16 bg-muted/20" />
                    </TableRow>
                  ))
                ) : accounts.length > 0 ? (
                  accounts.map((account) => (
                    <TableRow
                      key={account.id}
                      className="border-border hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() =>
                        router.push(`/system/ledger/${account.id}`)
                      }
                    >
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'p-2 rounded-xl shadow-sm',
                              account.userId ===
                                '00000000-0000-0000-0000-000000000000'
                                ? 'bg-indigo-500/10'
                                : 'bg-muted',
                            )}
                          >
                            {getAccountIcon(account.userId)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground leading-tight">
                              {account.userId === '00000000-0000-0000-0000-000000000000' 
                                ? 'Master Treasury' 
                                : account.accountName || 'Internal Account'}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                              UID: {account.userId.substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
                          {account.userId}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            'text-lg font-black tabular-nums tracking-tight',
                            account.balance < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-foreground',
                          )}
                        >
                          {account.balance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="ml-1 text-[10px] font-bold text-muted-foreground">
                          {account.currency}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={cn(
                            'rounded-lg px-2 py-0.5 text-[10px] font-bold border-none',
                            account.status === 'ACTIVE' &&
                              'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10',
                            account.status === 'FROZEN' &&
                              'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10',
                          )}
                        >
                          {account.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6 text-xs text-muted-foreground">
                        {new Date(account.updatedAt).toLocaleDateString()}{' '}
                        {new Date(account.updatedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No internal accounts found
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

      {/* Reconciliation Tip */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-4 text-amber-600 dark:text-amber-400">
        <div className="p-2 bg-amber-500/25 rounded-xl">
          <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400 mb-1">
            Accounting Integrity Tip
          </h4>
          <p className="text-xs text-amber-600/90 dark:text-amber-400/90 leading-relaxed">
            In a healthy double-entry system, the negative balance of the{' '}
            <strong>Master Treasury</strong> account should equal the sum of all
            customer wallet balances. If there is a discrepancy, run a manual
            reconciliation to identify missing entries.
          </p>
        </div>
      </div>
    </div>
  );
}
