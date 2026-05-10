'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Landmark,
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Hash,
  Activity,
  User,
} from 'lucide-react';
import { accountRequester } from '@/lib/requesters/accountRequester';
import { Account, AdminPaginatedResponse } from '@repo/dto';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function InternalLedgerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [account, setAccount] = useState<Account | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [accResponse, entriesResponse] = await Promise.all([
        accountRequester.getAccountById(id),
        accountRequester.getLedgerEntries(id, { page: page - 1, size: 20 }),
      ]);

      setAccount(accResponse.data);
      setEntries(entriesResponse.data);
      setTotalPages(entriesResponse.pagination.totalPages);
    } catch (error) {
      console.error('[LEDGER_DETAIL] Fetch error:', error);
      toast.error('Failed to fetch ledger details');
    } finally {
      setLoading(false);
    }
  }, [id, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !account) {
    return (
      <div className="flex items-center justify-center h-64 animate-pulse text-slate-400">
        Loading details...
      </div>
    );
  }

  if (!account) return null;

  return (
    <div className="space-y-6 pb-10">
      {/* Breadcrumb Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest gap-2">
          <span>System</span>
          <ChevronRight className="w-3 h-3" />
          <Link
            href="/system/ledger"
            className="hover:text-indigo-600 transition-colors"
          >
            Internal Ledger
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900">Account Statement</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Ledger Detail
            </h1>
          </div>
        </div>
      </div>

      {/* Account Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100">
                <Landmark className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">
                  {account.accountName}
                </CardTitle>
                <CardDescription className="text-xs font-mono font-bold text-slate-400 mt-0.5">
                  ID: {account.id}
                </CardDescription>
              </div>
            </div>
            <Badge
              className={cn(
                'rounded-lg px-3 py-1 text-[10px] font-black border-none',
                account.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-rose-50 text-rose-600',
              )}
            >
              {account.status}
            </Badge>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Internal User Mapping
                </p>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <p
                    className="text-sm font-bold text-slate-700 truncate"
                    title={account.userId}
                  >
                    {account.userId.substring(0, 8)}...
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Currency
                </p>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-sm font-bold text-slate-700">
                    {account.currency}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Opened Date
                </p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-sm font-bold text-slate-700">
                    {new Date(account.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Version Control
                </p>
                <div className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-sm font-bold text-slate-700">
                    v{(account as any).version || 1}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg shadow-indigo-100 ring-1 ring-indigo-100 bg-indigo-600 overflow-hidden">
          <CardContent className="p-6 flex flex-col justify-center h-full relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Landmark className="w-24 h-24 text-white" />
            </div>
            <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
              Available Balance
            </p>
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  'text-4xl font-black tracking-tighter text-white',
                  account.balance < 0 && 'text-rose-200',
                )}
              >
                {account.balance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
              <span className="text-indigo-200 font-bold text-sm">
                {account.currency}
              </span>
            </div>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-indigo-100 bg-indigo-500/30 w-fit px-3 py-1 rounded-full border border-indigo-400/30">
              <Activity className="w-3 h-3" />
              Account Statement Updated Real-time
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Entries Table */}
      <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/30 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-600">
                Ledger Entries (Statement)
              </CardTitle>
              <p className="text-[10px] text-slate-400 mt-1">
                Detailed audit trail of all transactions affecting this account.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="w-[180px] text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-6">
                    Timestamp
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Transaction Ref
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Type
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right pr-6">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse border-slate-50">
                      <TableCell colSpan={4} className="h-12 bg-slate-50/20" />
                    </TableRow>
                  ))
                ) : entries.length > 0 ? (
                  entries.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className="border-slate-50 hover:bg-slate-50/30 transition-colors group"
                    >
                      <TableCell className="pl-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(entry.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/transactions/${entry.transactionId}`}
                          className="text-xs font-mono font-bold text-indigo-600 hover:underline"
                        >
                          {entry.transactionId.substring(0, 18)}...
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            'rounded-md px-2 py-0.5 text-[9px] font-bold border-none',
                            entry.entryType === 'CREDIT'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-rose-50 text-rose-600',
                          )}
                        >
                          {entry.entryType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <span
                          className={cn(
                            'font-bold tabular-nums',
                            entry.entryType === 'CREDIT'
                              ? 'text-emerald-600'
                              : 'text-rose-600',
                          )}
                        >
                          {entry.entryType === 'CREDIT' ? '+' : '-'}
                          {entry.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-32 text-center text-slate-400"
                    >
                      No ledger entries found for this period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
