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
  CheckCircle2,
  Clock,
  HelpCircle,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sliders,
  User,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  adminApi,
  SystemApprovalRecord,
  SystemApprovalStats,
} from '@/lib/admin-api';
import {
  FilterActions,
  FilterSearchInput,
  FilterSelect,
} from '@/components/common/FilterElements';
import { TablePagination } from '@/components/common/TablePagination';
import { cn } from '@/lib/utils';

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

const getCategoryIcon = (category: SystemApprovalRecord['category']) => {
  switch (category) {
    case 'LIMIT':
      return <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    case 'FEE':
      return <Settings className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    default:
      return <ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
  }
};

const categoryShellClassName = (category: SystemApprovalRecord['category']) =>
  cn(
    'p-2 rounded-xl shrink-0',
    category === 'LIMIT' && 'bg-indigo-500/10',
    category === 'FEE' && 'bg-emerald-500/10',
    category === 'SECURITY' && 'bg-rose-500/10',
  );

const statusClassName = (status: SystemApprovalRecord['status']) =>
  cn(
    'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border',
    status === 'PENDING' &&
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    status === 'APPROVED' &&
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    status === 'REJECTED' &&
      'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  );

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<SystemApprovalRecord[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SystemApprovalRecord | null>(null);
  const [stats, setStats] = useState<SystemApprovalStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [inputNotes, setInputNotes] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filter Inputs (Temporary states)
  const [searchInput, setSearchInput] = useState('');
  const [statusInput, setStatusInput] = useState('ALL');
  const [categoryInput, setCategoryInput] = useState('ALL');

  // Applied Filters (Used for API calls)
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('ALL');
  const [appliedCategory, setAppliedCategory] = useState('ALL');

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.system.findApprovals({
        page,
        limit,
        search: appliedSearch || undefined,
        status: appliedStatus !== 'ALL' ? appliedStatus : undefined,
        category: appliedCategory !== 'ALL' ? appliedCategory : undefined,
      });

      const safeData = Array.isArray(response?.data) ? response.data : [];
      const safePagination = response?.pagination ?? {
        total: safeData.length,
        totalPages: 1,
      };

      setRequests(safeData);
      setStats(
        response?.stats ?? {
          pending: safeData.filter((item) => item.status === 'PENDING').length,
          approved: safeData.filter((item) => item.status === 'APPROVED').length,
          rejected: safeData.filter((item) => item.status === 'REJECTED').length,
        },
      );
      setTotal(safePagination.total || safeData.length);
      setTotalPages(safePagination.totalPages || 1);
      setSelectedRequest((current) => {
        if (!current) return safeData[0] ?? null;
        return safeData.find((item) => item.id === current.id) ?? safeData[0] ?? null;
      });
    } catch (error) {
      console.error('[APPROVALS_PAGE] Fetch error:', error);
      toast.error('Failed to load system approvals from backend');
    } finally {
      setLoading(false);
    }
  }, [page, limit, appliedSearch, appliedStatus, appliedCategory]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchInput);
    setAppliedStatus(statusInput);
    setAppliedCategory(categoryInput);
    setPage(1);
  };

  const handleReset = () => {
    setSearchInput('');
    setStatusInput('ALL');
    setCategoryInput('ALL');
    setAppliedSearch('');
    setAppliedStatus('ALL');
    setAppliedCategory('ALL');
    setPage(1);
  };

  const handleRefresh = () => {
    fetchApprovals();
    toast.success('System approval queue refreshed.');
  };

  const handleAction = async (
    request: SystemApprovalRecord,
    decision: 'APPROVED' | 'REJECTED',
  ) => {
    setActingId(request.id);
    try {
      const response = await adminApi.system.decideApproval(request.id, {
        decision,
        notes: inputNotes || 'Actioned by Admin Checker',
      });
      const updated = response?.data;
      toast.success(`Request ${request.id} successfully ${decision.toLowerCase()}.`);
      setInputNotes('');
      setSelectedRequest(updated ?? null);
      fetchApprovals();
    } catch (error) {
      console.error('[APPROVALS_PAGE] Decision error:', error);
      toast.error('Failed to action approval request');
    } finally {
      setActingId(null);
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
                    Pending Authorization
                  </span>
                  <span className="text-sm font-black text-foreground font-mono mt-0.5">
                    {stats.pending} Changes
                  </span>
                </div>
              </div>
              <span className="text-[8px] text-amber-500 font-bold bg-amber-500/5 px-1.5 py-0.5 rounded-full uppercase tracking-tight hidden sm:inline">
                Checker
              </span>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card hover:border-emerald-500/30 transition-all shadow-xs">
            <CardContent className="p-2.5 px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Approved
                  </span>
                  <span className="text-sm font-black text-foreground font-mono mt-0.5">
                    {stats.approved} Requests
                  </span>
                </div>
              </div>
              <span className="text-[8px] text-emerald-500 font-bold bg-emerald-500/5 px-1.5 py-0.5 rounded-full uppercase tracking-tight hidden sm:inline">
                Accepted
              </span>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card hover:border-rose-500/30 transition-all shadow-xs">
            <CardContent className="p-2.5 px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/10 rounded-xl">
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Rejected
                  </span>
                  <span className="text-sm font-black text-foreground font-mono mt-0.5">
                    {stats.rejected} Requests
                  </span>
                </div>
              </div>
              <span className="text-[8px] text-rose-500 font-bold bg-rose-500/5 px-1.5 py-0.5 rounded-full uppercase tracking-tight hidden sm:inline">
                Returned
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
              label="Approval Request"
              placeholder="Search id, action, maker, value, reason..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />

            <FilterSelect
              label="Decision Status"
              value={statusInput}
              onValueChange={setStatusInput}
              options={[
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Pending', value: 'PENDING' },
                { label: 'Approved', value: 'APPROVED' },
                { label: 'Rejected', value: 'REJECTED' },
              ]}
            />

            <FilterSelect
              label="Category"
              value={categoryInput}
              onValueChange={setCategoryInput}
              options={[
                { label: 'All Categories', value: 'ALL' },
                { label: 'Fee Changes', value: 'FEE' },
                { label: 'Limit Changes', value: 'LIMIT' },
                { label: 'Security Changes', value: 'SECURITY' },
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
                      Request
                    </TableHead>
                    <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Maker & Reason
                    </TableHead>
                    <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Change
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
                  {loading && requests.length === 0 ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index} className="animate-pulse border-border">
                        <TableCell colSpan={6} className="h-16 bg-muted/20" />
                      </TableRow>
                    ))
                  ) : requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center">
                          <ShieldCheck className="w-8 h-8 mb-2 opacity-20" />
                          <p className="text-sm font-medium">No system approvals matching search criteria</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((item, index) => (
                      <TableRow
                        key={item.id}
                        onClick={() => {
                          setSelectedRequest(item);
                          setInputNotes('');
                        }}
                        className={cn(
                          'border-border hover:bg-muted/50 transition-colors cursor-pointer group',
                          selectedRequest?.id === item.id && 'bg-indigo-500/5',
                        )}
                      >
                        <TableCell className="pl-6 text-xs font-bold text-muted-foreground tabular-nums">
                          {(page - 1) * limit + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-3">
                            <div className={categoryShellClassName(item.category)}>
                              {getCategoryIcon(item.category)}
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-mono text-[10px] font-bold text-muted-foreground">
                                {item.id}
                              </span>
                              <span className="text-xs font-black text-foreground">
                                {item.action}
                              </span>
                              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight">
                                {item.category}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-sm">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-tight mb-1">
                            <User className="w-3 h-3" />
                            <span>{item.proposedBy}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {item.reason}
                          </p>
                          <p className="text-[9px] text-muted-foreground mt-1 font-mono">
                            {formatDateTime(item.proposedAt)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 max-w-[220px]">
                            <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest truncate">
                              From: {item.originalValue}
                            </p>
                            <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest truncate">
                              To: {item.proposedValue}
                            </p>
                          </div>
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
                              setSelectedRequest(item);
                              setInputNotes('');
                            }}
                            className="rounded-xl h-8 text-[10px] font-bold gap-1.5 px-3 ml-auto text-indigo-600 hover:bg-indigo-500/10"
                          >
                            Audit
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
              itemName="approvals"
            />
          </CardContent>

          <aside className="bg-card min-h-[520px]">
            <CardHeader className="p-6 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Parameter Auditor
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Review maker request details before approving or rejecting sensitive changes.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {selectedRequest ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="space-y-2">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      Modification Details
                    </div>
                    <div className="text-sm font-black text-foreground">
                      {selectedRequest.action}
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border">
                      <div className="font-bold text-[10px] text-muted-foreground uppercase tracking-tight">
                        Maker Reason
                      </div>
                      <p className="mt-1 leading-relaxed">{selectedRequest.reason}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 bg-rose-500/5 rounded-2xl border border-rose-500/15">
                      <div className="text-[9px] text-rose-500 font-bold uppercase tracking-widest">
                        Original Value
                      </div>
                      <div className="text-xs font-mono font-bold mt-1 text-rose-600 dark:text-rose-400 break-words">
                        {selectedRequest.originalValue}
                      </div>
                    </div>
                    <div className="p-3.5 bg-emerald-500/5 rounded-2xl border border-emerald-500/15">
                      <div className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">
                        Proposed Value
                      </div>
                      <div className="text-xs font-mono font-bold mt-1 text-emerald-600 dark:text-emerald-400 break-words">
                        {selectedRequest.proposedValue}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/20 rounded-2xl border border-border text-[10px] text-muted-foreground leading-relaxed">
                    System approvals are a maker-checker control: one admin proposes a sensitive change, and another checker approves or rejects it before execution. This queue currently stores workflow decisions in the backend; individual settings screens still need to submit requests into it.
                  </div>

                  {selectedRequest.status === 'PENDING' ? (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                          Checker Notes / Remarks
                        </label>
                        <textarea
                          value={inputNotes}
                          onChange={(e) => setInputNotes(e.target.value)}
                          placeholder="Specify authorization context, checks performed, or reason for rejection..."
                          className="w-full text-xs p-3 rounded-2xl border border-border bg-card text-foreground focus:ring-2 focus:ring-indigo-500/20 focus:outline-none min-h-[92px]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => handleAction(selectedRequest, 'REJECTED')}
                          disabled={actingId === selectedRequest.id}
                          className="w-full py-2.5 rounded-xl font-bold bg-muted border border-border hover:bg-rose-500/10 hover:text-rose-500 text-foreground text-xs active:scale-95 transition-all"
                        >
                          Reject
                        </Button>
                        <Button
                          onClick={() => handleAction(selectedRequest, 'APPROVED')}
                          disabled={actingId === selectedRequest.id}
                          className="w-full py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 text-xs active:scale-95 transition-all"
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/40 rounded-2xl border border-border space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        {selectedRequest.status === 'APPROVED' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-500" />
                        )}
                        <span className="font-bold text-foreground">
                          Change {selectedRequest.status.toLowerCase()} by Checker
                        </span>
                      </div>
                      <p className="text-muted-foreground italic mt-1 font-mono text-[10px]">
                        Notes: {selectedRequest.notes || 'No notes provided'}
                      </p>
                      {selectedRequest.actionedAt && (
                        <p className="text-muted-foreground font-mono text-[10px]">
                          Actioned: {formatDateTime(selectedRequest.actionedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-24 text-center text-muted-foreground text-xs flex flex-col items-center justify-center gap-3">
                  <HelpCircle className="w-8 h-8 text-muted-foreground/40" />
                  Select an approval request from the queue to audit parameter diffs.
                </div>
              )}
            </CardContent>
          </aside>
        </div>
      </Card>
    </div>
  );
}
