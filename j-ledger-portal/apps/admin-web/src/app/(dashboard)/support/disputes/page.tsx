'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  FileWarning,
  HelpCircle,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, AdminDisputeRecord, AdminDisputeStats } from '@/lib/admin-api';
import {
  FilterActions,
  FilterSearchInput,
  FilterSelect,
} from '@/components/common/FilterElements';
import { TablePagination } from '@/components/common/TablePagination';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) =>
  `฿${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Unknown date';

  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const statusClassName = (status: AdminDisputeRecord['status']) =>
  cn(
    'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border',
    status === 'PENDING' &&
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    status === 'REVERSED' &&
      'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    status === 'RESOLVED' &&
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  );

export default function DisputesPage() {
  const [tickets, setTickets] = useState<AdminDisputeRecord[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<AdminDisputeRecord | null>(null);
  const [stats, setStats] = useState<AdminDisputeStats>({
    pending: 0,
    reversed: 0,
    resolved: 0,
    disputedAmount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [reversingId, setReversingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filter Inputs (Temporary states)
  const [searchInput, setSearchInput] = useState('');
  const [statusInput, setStatusInput] = useState('ALL');
  const [typeInput, setTypeInput] = useState('ALL');

  // Applied Filters (Used for API calls)
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('ALL');
  const [appliedType, setAppliedType] = useState('ALL');

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.disputes.findAll({
        page,
        limit,
        search: appliedSearch || undefined,
        status: appliedStatus !== 'ALL' ? appliedStatus : undefined,
        type: appliedType !== 'ALL' ? appliedType : undefined,
      });

      const safeData = Array.isArray(response?.data) ? response.data : [];
      const safePagination = response?.pagination ?? {
        total: safeData.length,
        totalPages: 1,
      };

      setTickets(safeData);
      setStats(
        response?.stats ?? {
          pending: safeData.filter((item) => item.status === 'PENDING').length,
          reversed: safeData.filter((item) => item.status === 'REVERSED').length,
          resolved: safeData.filter((item) => item.status === 'RESOLVED').length,
          disputedAmount: safeData.reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0,
          ),
        },
      );
      setTotal(safePagination.total || safeData.length);
      setTotalPages(safePagination.totalPages || 1);

      setSelectedTicket((current) => {
        if (!current) return safeData[0] ?? null;
        return safeData.find((item) => item.id === current.id) ?? safeData[0] ?? null;
      });
    } catch (error) {
      console.error('[DISPUTES_PAGE] Fetch error:', error);
      toast.error('Failed to load dispute queue from backend');
    } finally {
      setLoading(false);
    }
  }, [page, limit, appliedSearch, appliedStatus, appliedType]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchInput);
    setAppliedStatus(statusInput);
    setAppliedType(typeInput);
    setPage(1);
  };

  const handleReset = () => {
    setSearchInput('');
    setStatusInput('ALL');
    setTypeInput('ALL');
    setAppliedSearch('');
    setAppliedStatus('ALL');
    setAppliedType('ALL');
    setPage(1);
  };

  const handleRefresh = () => {
    fetchDisputes();
    toast.success('Dispute queue refreshed from finance ledger.');
  };

  const handleReversal = async (ticket: AdminDisputeRecord) => {
    setReversingId(ticket.id);
    try {
      await adminApi.disputes.reverse(ticket.disputeKey);
      toast.success('Dispute marked as reversed and removed from pending review.');
      fetchDisputes();
    } catch (error) {
      console.error('[DISPUTES_PAGE] Reverse error:', error);
      toast.error('Failed to update dispute reversal status');
    } finally {
      setReversingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-10 text-foreground">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-muted/20 dark:bg-muted/10 p-4 rounded-[2rem] border border-border/50">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          <Card className="rounded-2xl border border-border bg-card hover:border-amber-500/30 transition-all shadow-xs">
            <CardContent className="p-2.5 px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Pending Reviews
                  </span>
                  <span className="text-sm font-black text-foreground font-mono mt-0.5">
                    {stats.pending} Tickets
                  </span>
                </div>
              </div>
              <span className="text-[8px] text-amber-500 font-bold bg-amber-500/5 px-1.5 py-0.5 rounded-full uppercase tracking-tight hidden sm:inline">
                Queue
              </span>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card hover:border-rose-500/30 transition-all shadow-xs">
            <CardContent className="p-2.5 px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/10 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Disputed Volume
                  </span>
                  <span className="text-sm font-black text-foreground font-mono mt-0.5">
                    {formatCurrency(stats.disputedAmount)}
                  </span>
                </div>
              </div>
              <span className="text-[8px] text-rose-500 font-bold bg-rose-500/5 px-1.5 py-0.5 rounded-full uppercase tracking-tight hidden sm:inline">
                Locked
              </span>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card hover:border-emerald-500/30 transition-all shadow-xs">
            <CardContent className="p-2.5 px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Closed Cases
                  </span>
                  <span className="text-sm font-black text-foreground font-mono mt-0.5">
                    {stats.reversed + stats.resolved} Cases
                  </span>
                </div>
              </div>
              <span className="text-[8px] text-emerald-500 font-bold bg-emerald-500/5 px-1.5 py-0.5 rounded-full uppercase tracking-tight hidden sm:inline">
                Verified
              </span>
            </CardContent>
          </Card>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={loading}
          className="rounded-xl border-border bg-card hover:bg-muted h-10 w-10 self-end lg:self-center shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card className="border-none shadow-xs overflow-hidden bg-card text-card-foreground">
        <div className="p-4 bg-card border-b border-border">
          <form
            onSubmit={handleApplyFilter}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-card text-foreground"
          >
            <FilterSearchInput
              label="Case / Transaction"
              placeholder="Search case, transaction, account, reason..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />

            <FilterSelect
              label="Case Status"
              value={statusInput}
              onValueChange={setStatusInput}
              options={[
                { label: 'All Open Cases', value: 'ALL' },
                { label: 'Pending Review', value: 'PENDING' },
                { label: 'Reversed', value: 'REVERSED' },
                { label: 'Resolved', value: 'RESOLVED' },
              ]}
            />

            <FilterSelect
              label="Transaction Type"
              value={typeInput}
              onValueChange={setTypeInput}
              options={[
                { label: 'All Types', value: 'ALL' },
                { label: 'Topup', value: 'TOPUP' },
                { label: 'Transfer', value: 'TRANSFER' },
                { label: 'Payment', value: 'PAYMENT' },
                { label: 'Withdraw', value: 'WITHDRAW' },
                { label: 'Refund', value: 'REFUND' },
              ]}
            />

            <FilterActions searchLabel="Search" isLoading={loading} onReset={handleReset} />
          </form>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px]">
          <CardContent className="p-0 border-r border-border/60">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-[60px] text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-6">
                      No.
                    </TableHead>
                    <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Case Reference
                    </TableHead>
                    <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Reason
                    </TableHead>
                    <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right">
                      Amount
                    </TableHead>
                    <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">
                      Status
                    </TableHead>
                    <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right pr-6">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && tickets.length === 0 ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index} className="animate-pulse border-border">
                        <TableCell colSpan={6} className="h-16 bg-muted/20" />
                      </TableRow>
                    ))
                  ) : tickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center">
                          <FileWarning className="w-8 h-8 mb-2 opacity-20" />
                          <p className="text-sm font-medium">No dispute cases matching search criteria</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets.map((item, index) => (
                      <TableRow
                        key={item.id}
                        onClick={() => setSelectedTicket(item)}
                        className={cn(
                          'border-border hover:bg-muted/50 transition-colors cursor-pointer group',
                          selectedTicket?.id === item.id && 'bg-indigo-500/5',
                        )}
                      >
                        <TableCell className="pl-6 text-xs font-bold text-muted-foreground tabular-nums">
                          {(page - 1) * limit + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-[10px] font-bold text-muted-foreground">
                              {item.id}
                            </span>
                            <span className="text-xs font-black text-foreground">
                              {item.type}
                            </span>
                            <span className="font-mono text-[9px] text-muted-foreground">
                              Ref: {item.transactionId}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-sm">
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {item.reason}
                          </p>
                          <p className="text-[9px] text-muted-foreground mt-1 font-mono">
                            {formatDateTime(item.createdAt)}
                          </p>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-black text-foreground">
                          {formatCurrency(item.amount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={statusClassName(item.status)}>{item.status}</span>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedTicket(item);
                            }}
                            className="rounded-xl h-8 text-[10px] font-bold gap-1.5 px-3 ml-auto text-indigo-600 hover:bg-indigo-500/10"
                          >
                            Inspect
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              onPageChange={setPage}
              limit={limit}
              onLimitChange={(nextLimit) => {
                setLimit(nextLimit);
                setPage(1);
              }}
              isLoading={loading}
              itemName="disputes"
            />
          </CardContent>

          <aside className="bg-card min-h-[520px]">
            <CardHeader className="p-6 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Ledger Inspector
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Cross-check debit and credit legs from finance-service ledger entries.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {selectedTicket ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      Discrepancy Details
                    </div>
                    <div className="text-sm font-black text-foreground">
                      {selectedTicket.type}
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      {selectedTicket.reason}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/30 rounded-2xl border border-border">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                        Transaction
                      </p>
                      <p className="text-[10px] font-mono font-bold text-foreground mt-1 break-all">
                        {selectedTicket.transactionId}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-2xl border border-border">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                        Finance Status
                      </p>
                      <p className="text-[10px] font-mono font-bold text-foreground mt-1">
                        {selectedTicket.transactionStatus}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      Debit Leg
                    </div>
                    <div className="p-4 bg-muted/30 rounded-2xl border border-border space-y-2">
                      <div className="text-xs font-mono font-bold text-foreground truncate">
                        {selectedTicket.debitLeg.account}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>
                          Leg type: <strong className="text-rose-500">{selectedTicket.debitLeg.type}</strong>
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          {formatCurrency(selectedTicket.debitLeg.amount)}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      Credit Leg
                    </div>
                    <div className="p-4 bg-muted/30 rounded-2xl border border-border space-y-2">
                      <div className="text-xs font-mono font-bold text-foreground truncate">
                        {selectedTicket.creditLeg.account}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>
                          Leg type: <strong className="text-emerald-500">{selectedTicket.creditLeg.type}</strong>
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          {formatCurrency(selectedTicket.creditLeg.amount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/20 rounded-2xl border border-border text-[10px] text-muted-foreground leading-relaxed">
                    <div className="flex items-center justify-between font-mono font-bold mb-2">
                      <span>{selectedTicket.sender}</span>
                      <ArrowRight className="w-3.5 h-3.5 mx-2 shrink-0" />
                      <span>{selectedTicket.recipient}</span>
                    </div>
                    This view uses real finance transactions and ledger entries. Reversal status is recorded in the admin dispute workflow.
                  </div>

                  {selectedTicket.status === 'PENDING' ? (
                    <Button
                      onClick={() => handleReversal(selectedTicket)}
                      disabled={reversingId === selectedTicket.id}
                      className="w-full py-3 rounded-2xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <RotateCcw className={`w-4 h-4 ${reversingId === selectedTicket.id ? 'animate-spin' : ''}`} />
                      {reversingId === selectedTicket.id ? 'Updating Case...' : 'Mark Dispute Reversed'}
                    </Button>
                  ) : (
                    <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-center font-bold text-xs flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Dispute workflow status closed.
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-24 text-center text-muted-foreground text-xs flex flex-col items-center justify-center gap-3">
                  <HelpCircle className="w-8 h-8 text-muted-foreground/40" />
                  Select a disputed transaction from the queue to inspect double-entry ledger legs.
                </div>
              )}
            </CardContent>
          </aside>
        </div>
      </Card>
    </div>
  );
}
