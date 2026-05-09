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
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
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
import {
  FilterSearchInput,
  FilterSelect,
  FilterActions,
  FilterField,
  FilterDatePicker,
} from '@/components/common/FilterElements';

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
  const [currentPage, setCurrentPage] = useState(0); // API uses 0-based index
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Active Filters used for API call
  const [activeFilters, setActiveFilters] = useState({
    status: 'ALL',
    type: 'ALL',
    reference: '',
    startDate: '',
    endDate: '',
    page: 0,
  });

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: activeFilters.page,
        size: 10,
        ...(activeFilters.status !== 'ALL' && { status: activeFilters.status }),
        ...(activeFilters.type !== 'ALL' && { type: activeFilters.type }),
        ...(activeFilters.reference && { reference: activeFilters.reference }),
        ...(activeFilters.startDate && { startDate: activeFilters.startDate }),
        ...(activeFilters.endDate && { endDate: activeFilters.endDate }),
      };

      const res = await transactionRequester.getHistory(params);
      setTransactions(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalItems(res.pagination.total);
      setCurrentPage(res.pagination.page);
    } catch (err) {
      console.error('[TRANSACTIONS_PAGE] Fetch error:', err);
      toast.error('Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveFilters({
      status,
      type,
      reference,
      startDate,
      endDate,
      page: 0,
    });
    setCurrentPage(0);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 0 || newPage >= totalPages) return;
    setActiveFilters((prev) => ({ ...prev, page: newPage }));
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
        return <DollarSign className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Transactions</h2>
          <p className="text-slate-500 mt-1">
            Monitor and manage all financial activities across the platform.
          </p>
        </div>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
        {/* Filter Toolbar */}
        <div className="p-4 bg-white border-b border-slate-100">
          <form
            onSubmit={handleApplyFilter}
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end"
          >
            <FilterSearchInput
              label="Reference ID"
              placeholder="TXN-XXXXXX"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />

            <FilterSelect
              label="Transaction Status"
              value={status}
              onValueChange={(val) => setStatus(val || 'ALL')}
              options={[
                { label: 'ALL STATUS', value: 'ALL' },
                { label: 'SUCCESS', value: TransactionStatus.SUCCESS },
                { label: 'PENDING', value: TransactionStatus.PENDING },
                { label: 'FAILED', value: TransactionStatus.FAILED },
              ]}
            />

            <FilterSelect
              label="Transaction Type"
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
              <tr className="border-b border-slate-100 bg-slate-50/30 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                <th className="px-6 py-4">Transaction ID / Reference</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8 bg-slate-50/10" />
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                        <Activity className="w-8 h-8 text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-medium">
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
                transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div>
                        <p className="text-sm font-bold text-slate-800 tabular-nums">
                          {txn.id.slice(0, 12).toUpperCase()}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                          ID: {txn.id}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            txn.transactionType === TransactionType.TOPUP
                              ? 'bg-emerald-50'
                              : txn.transactionType === TransactionType.WITHDRAW
                                ? 'bg-rose-50'
                                : 'bg-indigo-50'
                          }`}
                        >
                          {getTransactionIcon(txn.transactionType)}
                        </div>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">
                          {txn.transactionType}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p
                        className={`text-sm font-black tabular-nums ${
                          txn.transactionType === TransactionType.TOPUP
                            ? 'text-emerald-600'
                            : txn.transactionType === TransactionType.WITHDRAW
                              ? 'text-rose-600'
                              : 'text-slate-800'
                        }`}
                      >
                        {txn.transactionType === TransactionType.TOPUP
                          ? '+'
                          : txn.transactionType === TransactionType.WITHDRAW
                            ? '-'
                            : ''}
                        {Number(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="ml-1 text-[10px] font-bold opacity-70">
                          {txn.currency}
                        </span>
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      {txn.status === TransactionStatus.SUCCESS ? (
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Success
                        </div>
                      ) : txn.status === TransactionStatus.FAILED ? (
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-wider border border-rose-100">
                          <XCircle className="w-3 h-3 mr-1" />
                          Failed
                        </div>
                      ) : (
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-wider border border-amber-100">
                          <Clock className="w-3 h-3 mr-1" />
                          {txn.status}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 text-xs text-slate-500 font-medium tabular-nums">
                      {format(new Date(txn.createdAt), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link href={`/transactions/${txn.id}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold text-xs rounded-lg"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Page <span className="text-slate-800">{currentPage + 1}</span> of{' '}
              <span className="text-slate-800">{totalPages}</span>
              <span className="ml-2 opacity-50">•</span>
              <span className="ml-2">{totalItems} Total Records</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0 || isLoading}
                className="h-8 px-3 text-xs font-black uppercase tracking-widest rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1 || isLoading}
                className="h-8 px-3 text-xs font-black uppercase tracking-widest rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
