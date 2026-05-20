'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Calendar as CalendarIcon,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  DollarSign,
  X,
  Download,
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { transactionRequester } from '@/lib/requesters/transactionRequester';
import { Transaction, TransactionStatus, TransactionType } from '@repo/dto';
import { toast } from 'sonner';
import { TablePagination } from '@/components/common/TablePagination';
import { cn } from '@/lib/utils';
import {
  FilterSearchInput,
  FilterSelect,
  FilterActions,
  FilterField,
  FilterDatePicker,
} from '@/components/common/FilterElements';
import { TransactionDetailDrawer } from '@/components/dashboard/TransactionDetailDrawer';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [status, setStatus] = useState<string>('ALL');
  const [type, setType] = useState<string>('ALL');
  const [reference, setReference] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get('userId');

  // Drawer & Export States
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast.error('No transactions to export.');
      return;
    }

    // Create CSV content
    const headers = [
      'No.',
      'Reference ID',
      'Type',
      'Amount',
      'Currency',
      'Status',
      'Created At',
    ];
    const rows = transactions.map((txn, index) => [
      index + 1,
      String(txn.transactionId || txn.id).toUpperCase(),
      txn.transactionType,
      txn.amount,
      txn.currency || 'THB',
      txn.status,
      format(new Date(txn.createdAt), 'yyyy-MM-dd HH:mm:ss'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');

    // Create download link
    const blob = new Blob([`\ufeff${csvContent}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `transactions-export-${format(new Date(), 'yyyyMMdd-HHmmss')}.csv`,
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Transaction history exported successfully!');
  };

  // Active Filters used for API call
  const [activeFilters, setActiveFilters] = useState({
    status: 'ALL',
    type: 'ALL',
    reference: '',
    startDate: '',
    endDate: '',
    userId: userIdParam || '',
    page: 1,
  });

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: activeFilters.page - 1, // Convert to 0-based for API
        size: 10,
        ...(activeFilters.status !== 'ALL' && { status: activeFilters.status }),
        ...(activeFilters.type !== 'ALL' && { type: activeFilters.type }),
        ...(activeFilters.reference && { reference: activeFilters.reference }),
        ...(activeFilters.startDate && { startDate: activeFilters.startDate }),
        ...(activeFilters.endDate && { endDate: activeFilters.endDate }),
        ...(activeFilters.userId && { userId: activeFilters.userId }),
      };

      const res = await transactionRequester.getHistory(params);
      const safeData = Array.isArray(res?.data) ? res.data : [];
      const safePagination = res?.pagination ?? {
        page: 0,
        total: safeData.length,
        totalPages: 1,
      };

      setTransactions(safeData);
      setTotalPages(
        typeof safePagination.totalPages === 'number' &&
          safePagination.totalPages > 0
          ? safePagination.totalPages
          : 1,
      );
      setTotalItems(
        typeof safePagination.total === 'number'
          ? safePagination.total
          : safeData.length,
      );
      setCurrentPage(
        typeof safePagination.page === 'number' ? safePagination.page + 1 : 1,
      ); // Convert back to 1-based
    } catch (err) {
      console.error('[TRANSACTIONS_PAGE] Fetch error:', err);
      toast.error('Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters]);

  useEffect(() => {
    const normalizedUserIdParam = userIdParam || '';
    if (normalizedUserIdParam !== activeFilters.userId) {
      setActiveFilters((prev) => ({
        ...prev,
        userId: normalizedUserIdParam,
        page: 1,
      }));
    }
  }, [userIdParam, activeFilters.userId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveFilters((prev) => ({
      status,
      type,
      reference,
      startDate,
      endDate,
      userId: prev.userId,
      page: 1, // Reset to page 1
    }));
  };

  const handlePageChange = (page: number) => {
    setActiveFilters((prev) => ({ ...prev, page }));
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case TransactionType.TOPUP:
        return <ArrowDownLeft className="w-4 h-4 text-emerald-500" />;
      case TransactionType.WITHDRAW:
        return <ArrowUpRight className="w-4 h-4 text-rose-500" />;
      case TransactionType.TRANSFER:
        return <ArrowRightLeft className="w-4 h-4 text-indigo-500" />;
      default:
        return <DollarSign className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 pb-10 text-foreground">
      {/* Title Header with Export CSV Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Transaction Logs
          </h1>
          <p className="text-xs text-muted-foreground">
            Monitor ledger movements and double-entry bookkeeping details.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="h-10 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 border-indigo-500/20 text-xs font-bold rounded-lg transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {activeFilters.userId && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge
                variant="secondary"
                className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md flex items-center gap-1"
              >
                Filtering by User:{' '}
                <span className="font-mono text-[10px]">
                  {activeFilters.userId}
                </span>
                <button
                  onClick={() =>
                    setActiveFilters((prev) => ({
                      ...prev,
                      userId: '',
                      page: 1,
                    }))
                  }
                  className="ml-1 hover:text-indigo-800"
                >
                  <X size={12} />
                </button>
              </Badge>
            </div>
          </div>
        </div>
      )}

      <Card className="border-none shadow-xs rounded-xl overflow-hidden bg-card text-card-foreground">
        {/* Filter Toolbar */}
        <div className="p-4 bg-card border-b border-border">
          <form
            onSubmit={handleApplyFilter}
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end bg-card text-foreground"
          >
            <FilterSearchInput
              label="Reference ID"
              placeholder="Search by Reference ID..."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />

            <FilterSelect
              label="Status"
              value={status}
              onValueChange={(val) => setStatus(val || 'ALL')}
              options={[
                { label: 'ALL STATUS', value: 'ALL' },
                { label: 'COMPLETED', value: TransactionStatus.COMPLETED },
                { label: 'PENDING', value: TransactionStatus.PENDING },
                { label: 'FAILED', value: TransactionStatus.FAILED },
                { label: 'CANCELLED', value: TransactionStatus.CANCELLED },
              ]}
            />

            <FilterSelect
              label="Type"
              value={type}
              onValueChange={(val) => setType(val || 'ALL')}
              options={[
                { label: 'ALL TYPES', value: 'ALL' },
                { label: 'TOP-UP', value: TransactionType.TOPUP },
                { label: 'WITHDRAW', value: TransactionType.WITHDRAW },
                { label: 'TRANSFER', value: TransactionType.TRANSFER },
              ]}
            />

            <FilterDatePicker
              label="Date From"
              value={startDate}
              onChange={setStartDate}
              placeholder="Start date"
            />

            <FilterDatePicker
              label="Date To"
              value={endDate}
              onChange={setEndDate}
              placeholder="End date"
            />

            <FilterActions
              searchLabel="Search"
              isLoading={isLoading}
              onReset={() => {
                setReference('');
                setStartDate('');
                setEndDate('');
                setStatus('ALL');
                setType('ALL');
                handleApplyFilter();
              }}
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
                <th className="px-6 py-4 w-12 text-center">No.</th>
                <th className="px-6 py-4">Reference ID</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8 bg-muted/10" />
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Activity className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                      <p className="text-muted-foreground font-medium">
                        No transactions found matching your criteria.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReference('');
                          setStatus('ALL');
                          setType('ALL');
                          setStartDate('');
                          setEndDate('');
                          setActiveFilters({
                            status: 'ALL',
                            type: 'ALL',
                            reference: '',
                            startDate: '',
                            endDate: '',
                            userId: '',
                            page: 0,
                          });
                        }}
                        className="mt-2 text-xs rounded-lg"
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((txn, index) => (
                  <tr
                    key={txn.id}
                    onClick={() => {
                      setSelectedTransactionId(String(txn.id));
                      setIsDrawerOpen(true);
                    }}
                    className="hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-5 text-center font-bold text-xs text-muted-foreground">
                      {(currentPage - 1) * 10 + index + 1}
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-mono font-semibold text-foreground select-all">
                        {String(txn.transactionId || txn.id).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center',
                            txn.transactionType === TransactionType.TOPUP
                              ? 'bg-emerald-500/10'
                              : txn.transactionType === TransactionType.WITHDRAW
                                ? 'bg-rose-500/10'
                                : 'bg-indigo-500/10',
                          )}
                        >
                          {getTransactionIcon(txn.transactionType)}
                        </div>
                        <span className="text-xs font-bold text-foreground uppercase tracking-tight">
                          {txn.transactionType}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p
                        className={cn(
                          'text-sm font-black tabular-nums',
                          txn.transactionType === TransactionType.TOPUP
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : txn.transactionType ===
                                  TransactionType.WITHDRAW ||
                                txn.transactionType === TransactionType.PAYMENT
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-foreground',
                        )}
                      >
                        {txn.transactionType === TransactionType.TOPUP
                          ? '+ '
                          : txn.transactionType === TransactionType.WITHDRAW ||
                              txn.transactionType === TransactionType.PAYMENT
                            ? '- '
                            : ''}
                        ฿
                        {Number(txn.amount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      {txn.status === TransactionStatus.COMPLETED ? (
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Completed
                        </div>
                      ) : txn.status === TransactionStatus.FAILED ? (
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider border border-rose-500/20">
                          <XCircle className="w-3 h-3 mr-1" />
                          Failed
                        </div>
                      ) : (
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/20">
                          <Clock className="w-3 h-3 mr-1" />
                          {txn.status}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 text-xs text-muted-foreground font-medium tabular-nums">
                      {format(new Date(txn.createdAt), 'MMM d, yyyy HH:mm')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      </Card>

      {/* Slide-over Transaction Detail Panel */}
      <TransactionDetailDrawer
        transactionId={selectedTransactionId}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedTransactionId(null);
        }}
      />
    </div>
  );
}
