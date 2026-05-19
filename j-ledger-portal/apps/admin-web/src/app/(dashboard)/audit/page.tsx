'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { adminApi } from '@/lib/admin-api';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  RotateCcw,
  Filter,
  History,
  Eye,
  ShieldAlert,
  Cpu,
  Terminal,
  Calendar as CalendarIcon,
  Users,
  ShieldCheck,
  FileText,
  Shield,
  CreditCard,
  Wallet,
  Activity,
  Box,
  LockKeyhole,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  FilterSearchInput,
  FilterSelect,
  FilterActions,
} from '@/components/common/FilterElements';
import { TablePagination } from '@/components/common/TablePagination';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    creations: 0,
    updates: 0,
    deletions: 0,
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const searchParams = useSearchParams();

  // Draft Filters (Values in inputs)
  const [adminUserId, setAdminUserId] = useState(
    searchParams.get('adminUserId') || '',
  );
  const [action, setAction] = useState<string>('ALL');
  const [resourceType, setResourceType] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Applied Filters (Trigger search only on submission)
  const [appliedFilters, setAppliedFilters] = useState({
    adminUserId: searchParams.get('adminUserId') || '',
    action: 'ALL',
    resourceType: 'ALL',
    startDate: '',
    endDate: '',
  });

  const limit = 50;

  const fetchStats = useCallback(async () => {
    try {
      const response = await adminApi.audit.getStats();
      setStats(response.data || response);
    } catch (error) {
      console.error('[AUDIT_PAGE] Stats error:', error);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.audit.findAll({
        page,
        limit,
        adminUserId: appliedFilters.adminUserId || undefined,
        action: appliedFilters.action !== 'ALL' ? appliedFilters.action : undefined,
        resourceType: appliedFilters.resourceType !== 'ALL' ? appliedFilters.resourceType : undefined,
        startDate: appliedFilters.startDate || undefined,
        endDate: appliedFilters.endDate || undefined,
      });
      setLogs(response.data || []);
      
      if (response.pagination) {
        setTotalPages(response.pagination.totalPages || 1);
        setTotal(response.pagination.total || 0);
      }
    } catch (error) {
      console.error('[AUDIT_PAGE] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [page, appliedFilters]);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs, fetchStats]);

  const handleFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1);
    setAppliedFilters({
      adminUserId,
      action,
      resourceType,
      startDate,
      endDate,
    });
  };

  const handleClearFilters = () => {
    setAdminUserId('');
    setAction('ALL');
    setResourceType('ALL');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setAppliedFilters({
      adminUserId: '',
      action: 'ALL',
      resourceType: 'ALL',
      startDate: '',
      endDate: '',
    });
  };

  const getActionColor = (action: string) => {
    const a = action.toUpperCase();
    if (a.includes('KYC')) return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
    if (a.includes('STAFF') || a.includes('ADMIN'))
      return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    if (a.includes('USER')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    if (
      a.includes('TRANSACTION') ||
      a.includes('LEDGER') ||
      a.includes('ACCOUNT')
    )
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (a.includes('ROLE') || a.includes('PERMISSION') || a.includes('SYSTEM'))
      return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
    if (a.includes('AUDIT') || a.includes('DASHBOARD'))
      return 'bg-muted text-muted-foreground border-border';
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  };

  const getResourceIcon = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t.includes('USER')) return <Users className="w-3 h-3" />;
    if (t.includes('STAFF') || t.includes('ADMIN'))
      return <ShieldCheck className="w-3 h-3" />;
    if (t.includes('KYC')) return <FileText className="w-3 h-3" />;
    if (t.includes('ROLE')) return <Shield className="w-3 h-3" />;
    if (t.includes('PERMISSION')) return <LockKeyhole className="w-3 h-3" />;
    if (t.includes('TRANSACTION')) return <CreditCard className="w-3 h-3" />;
    if (t.includes('ACCOUNT')) return <Wallet className="w-3 h-3" />;
    if (t.includes('AUDIT')) return <Activity className="w-3 h-3" />;
    return <Box className="w-3 h-3" />;
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-emerald-500';
    if (status >= 400) return 'text-rose-500';
    return 'text-amber-500';
  };

  return (
    <div className="space-y-4 pb-10 text-foreground">
      {/* Audit Overview Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-xl shadow-xs border border-border">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-500 animate-pulse" />
          <span className="text-sm font-bold text-foreground">
            Audit Snapshot
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-4 md:gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground font-medium">
              Creations:{' '}
              <strong className="text-foreground">{stats.creations}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-muted-foreground font-medium">
              Updates:{' '}
              <strong className="text-foreground">{stats.updates}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-muted-foreground font-medium">
              Deletions:{' '}
              <strong className="text-foreground">{stats.deletions}</strong>
            </span>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-xs overflow-hidden bg-card text-card-foreground">
        {/* Filter Toolbar */}
        <div className="p-3 bg-card border-b border-border">
          <form
            onSubmit={handleFilter}
            className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
          >
            <FilterSearchInput
              label="Admin Identifier"
              placeholder="ID or Name..."
              value={adminUserId}
              onChange={(e) => setAdminUserId(e.target.value)}
            />

            <FilterSelect
              label="Operation Action"
              value={action}
              onValueChange={(val: string) => setAction(val || 'ALL')}
              options={[
                { label: 'ALL PERMISSIONS', value: 'ALL' },
                { label: 'CREATE_ADMINS', value: 'CREATE_ADMINS' },
                { label: 'MANAGE_STAFF', value: 'MANAGE_STAFF' },
                { label: 'DELETE_ADMINS', value: 'DELETE_ADMINS' },
                { label: 'APPROVE_KYC', value: 'APPROVE_KYC' },
                { label: 'REJECT_KYC', value: 'REJECT_KYC' },
                { label: 'MANAGE_SYSTEM_ROLES', value: 'MANAGE_SYSTEM_ROLES' },
                {
                  label: 'MANAGE_SYSTEM_PERMISSIONS',
                  value: 'MANAGE_SYSTEM_PERMISSIONS',
                },
                { label: 'ASSIGN_STAFF_ROLES', value: 'ASSIGN_STAFF_ROLES' },
                { label: 'FREEZE_USERS', value: 'FREEZE_USERS' },
                { label: 'UNFREEZE_USERS', value: 'UNFREEZE_USERS' },
                {
                  label: 'RESET_STAFF_PASSWORD',
                  value: 'RESET_STAFF_PASSWORD',
                },
              ]}
            />

            <FilterSelect
              label="Resource Type"
              value={resourceType}
              onValueChange={(val: string) => setResourceType(val || 'ALL')}
              options={[
                { label: 'ALL RESOURCES', value: 'ALL' },
                { label: 'USER', value: 'USER' },
                { label: 'KYC_DOCUMENT', value: 'KYC_DOCUMENT' },
                { label: 'ADMIN_USER', value: 'ADMIN_USER' },
                { label: 'ACCOUNT', value: 'ACCOUNT' },
                { label: 'TRANSACTION', value: 'TRANSACTION' },
                { label: 'PII', value: 'PII' },
                { label: 'RECONCILIATION', value: 'RECONCILIATION_REPORT' },
              ]}
            />

            <FilterActions
              searchLabel="Search"
              isLoading={loading}
              onReset={handleClearFilters}
              className="md:col-span-2"
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
                <th className="px-6 py-2.5 border-r border-border text-left">
                  Execution Time
                </th>
                <th className="px-6 py-2.5 text-center border-r border-border">
                  Actor
                </th>
                <th className="px-6 py-2.5 text-center border-r border-border">
                  Action
                </th>
                <th className="px-6 py-2.5 text-center border-r border-border">
                  Description
                </th>
                <th className="px-6 py-2.5 text-center border-r border-border">
                  Target Resource
                </th>
                <th className="px-6 py-2.5 text-center">Intel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8 h-16 bg-muted/10" />
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-muted-foreground font-semibold"
                  >
                    No audit records found matching your selection.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr
                    key={log.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="px-6 py-2 border-r border-border">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">
                          {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono tracking-tighter">
                          {format(new Date(log.createdAt), 'yyyy')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-2 border-r border-border text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-indigo-500/10 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                            <Cpu className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-foreground leading-tight">
                            {log.adminUser?.username || 'Admin System'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-2 border-r border-border">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={`px-2 py-0.5 w-fit rounded-md text-[9px] font-black uppercase tracking-wider border ${getActionColor(log.action)}`}
                        >
                          {log.action}
                        </span>
                        <div className="flex items-center gap-1">
                          <div
                            className={`w-1 h-1 rounded-full ${log.responseStatus >= 400 ? 'bg-rose-400' : 'bg-emerald-400'}`}
                          />
                          <span
                            className={`text-[9px] font-bold ${getStatusColor(log.responseStatus)}`}
                          >
                            {log.responseStatus}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-2 border-r border-border text-center">
                      {log.reason && (
                        <span
                          className="text-[10px] font-bold text-foreground leading-tight block max-w-[150px] mx-auto"
                          title={log.reason}
                        >
                          {log.reason}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-2 border-r border-border">
                      <div className="flex items-center justify-center gap-2">
                        <div className="p-1 bg-muted rounded-lg text-muted-foreground border border-border">
                          {getResourceIcon(log.resourceType)}
                        </div>
                        <span className="text-[9px] font-black text-foreground uppercase tracking-widest">
                          {log.resourceType}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-2 text-center">
                      <Dialog>
                        <DialogTrigger
                          render={
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                              className="h-7 px-3 rounded-lg text-[9px] font-bold border-border hover:bg-muted hover:border-indigo-500/20 text-muted-foreground hover:text-foreground transition-all active:scale-95 group/btn"
                            >
                              Inspect
                              <ChevronRight className="w-3 h-3 ml-1 text-muted-foreground/50 group-hover/btn:text-indigo-500 dark:group-hover/btn:text-indigo-400 transition-colors" />
                            </Button>
                          }
                        />
                        <DialogContent className="sm:max-w-3xl bg-card text-card-foreground rounded-2xl border border-border shadow-2xl overflow-hidden">
                          <DialogHeader className="bg-muted/30 p-6 border-b border-border">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                              <Terminal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                              Audit Log Intel
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                              Complete trace of the administrative mutation and
                              payload.
                            </DialogDescription>
                          </DialogHeader>
                          {selectedLog && (
                            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                                <div className="space-y-4">
                                  <div>
                                    <p className="font-black text-muted-foreground uppercase tracking-widest text-[9px] mb-1">
                                      Request Intel
                                    </p>
                                    <div className="space-y-1.5 font-bold text-foreground">
                                      <p className="flex justify-between border-b border-border pb-1">
                                        <span>Actor Name:</span>
                                        <span>
                                          {selectedLog.adminUser
                                            ? `${selectedLog.adminUser.firstName || ''} ${selectedLog.adminUser.lastName || ''} (${selectedLog.adminUser.username})`.trim()
                                            : 'Admin System'}
                                        </span>
                                      </p>
                                      <p className="flex justify-between border-b border-border pb-1">
                                        <span>Actor ID:</span>
                                        <span className="font-mono text-[10px] text-muted-foreground">
                                          {selectedLog.adminUserId}
                                        </span>
                                      </p>
                                      <p className="flex justify-between border-b border-border pb-1">
                                        <span>IP Address:</span>
                                        <span className="font-mono text-indigo-600 dark:text-indigo-400">
                                          {selectedLog.ipAddress}
                                        </span>
                                      </p>
                                      <p className="flex justify-between border-b border-border pb-1">
                                        <span>Method:</span>
                                        <span>{selectedLog.action}</span>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <div>
                                    <p className="font-black text-muted-foreground uppercase tracking-widest text-[9px] mb-1">
                                      Target Context
                                    </p>
                                    <div className="space-y-1.5 font-bold text-foreground">
                                      <p className="flex justify-between border-b border-border pb-1">
                                        <span>Type:</span>
                                        <span className="uppercase text-indigo-600 dark:text-indigo-400">
                                          {selectedLog.resourceType}
                                        </span>
                                      </p>
                                      <p className="flex justify-between border-b border-border pb-1">
                                        <span>Identifier:</span>
                                        <span className="font-mono text-muted-foreground">
                                          {selectedLog.resourceId || 'N/A'}
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <p className="font-black text-muted-foreground uppercase tracking-widest text-[9px] mb-1">
                                    User Agent
                                  </p>
                                  <p className="text-[10px] text-muted-foreground italic bg-muted p-2 rounded-lg border border-border">
                                    {selectedLog.userAgent}
                                  </p>
                                </div>
                              </div>

                              {selectedLog.requestPayload && (
                                <div className="space-y-2">
                                  <p className="font-black text-muted-foreground uppercase tracking-widest text-[9px] ml-1">
                                    Request Payload
                                  </p>
                                  <div className="p-4 bg-slate-950 dark:bg-slate-950/60 rounded-xl overflow-hidden border border-border">
                                    <pre className="text-[10px] text-emerald-500 dark:text-emerald-400 font-mono overflow-x-auto custom-scrollbar leading-relaxed">
                                      {JSON.stringify(
                                        selectedLog.requestPayload,
                                        null,
                                        2,
                                      )}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {selectedLog.changes && (
                                <div className="space-y-2">
                                  <p className="font-black text-muted-foreground uppercase tracking-widest text-[9px] ml-1 text-amber-500">
                                    Resource Mutation (Changes)
                                  </p>
                                  <div className="p-4 bg-slate-950 dark:bg-slate-950/60 rounded-xl overflow-hidden border border-border">
                                    <pre className="text-[10px] text-amber-500 dark:text-amber-400 font-mono overflow-x-auto custom-scrollbar leading-relaxed">
                                      {JSON.stringify(
                                        selectedLog.changes,
                                        null,
                                        2,
                                      )}
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          onPageChange={setPage}
          isLoading={loading}
        />
      </Card>
    </div>
  );
}
