'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  ChevronLeft, ChevronRight, Search, RotateCcw, Filter, History, Eye, ShieldAlert, Cpu, 
  Terminal, Calendar as CalendarIcon, Users, ShieldCheck, FileText, Shield, 
  CreditCard, Wallet, Activity, Box, LockKeyhole 
} from 'lucide-react';
import { format } from 'date-fns';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, creations: 0, updates: 0, deletions: 0 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const searchParams = useSearchParams();

  // Filters
  const [adminUserId, setAdminUserId] = useState(searchParams.get('adminUserId') || '');
  const [action, setAction] = useState<string>('ALL');
  const [resourceType, setResourceType] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
        adminUserId: adminUserId || undefined,
        action: action !== 'ALL' ? action : undefined,
        resourceType: resourceType !== 'ALL' ? resourceType : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setLogs(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (error) {
      console.error('[AUDIT_PAGE] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [page, adminUserId, action, resourceType, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs, fetchStats]);

  const handleFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setAdminUserId('');
    setAction('ALL');
    setResourceType('ALL');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getActionColor = (action: string) => {
    const a = action.toUpperCase();
    if (a.includes('KYC')) return 'bg-cyan-50 text-cyan-600 border-cyan-100';
    if (a.includes('STAFF') || a.includes('ADMIN')) return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    if (a.includes('USER')) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (a.includes('TRANSACTION') || a.includes('LEDGER') || a.includes('ACCOUNT')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (a.includes('ROLE') || a.includes('PERMISSION') || a.includes('SYSTEM')) return 'bg-orange-50 text-orange-600 border-orange-100';
    if (a.includes('AUDIT') || a.includes('DASHBOARD')) return 'bg-slate-50 text-slate-600 border-slate-100';
    return 'bg-amber-50 text-amber-600 border-amber-100';
  };

  const getResourceIcon = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t.includes('USER')) return <Users className="w-3 h-3" />;
    if (t.includes('STAFF') || t.includes('ADMIN')) return <ShieldCheck className="w-3 h-3" />;
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
    <div className="space-y-4 pb-10">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Audit Intelligence</h2>
        <p className="text-sm text-slate-500 mt-1">
          Traceable history of administrative operations and resource mutations.
        </p>
      </div>

      {/* Audit Overview Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-bold text-slate-700">Audit Snapshot</span>
        </div>

        <div className="flex items-center flex-wrap gap-4 md:gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-500 font-medium">Creations: <strong className="text-slate-800">{stats.creations}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-500 font-medium">Updates: <strong className="text-slate-800">{stats.updates}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-slate-500 font-medium">Deletions: <strong className="text-slate-800">{stats.deletions}</strong></span>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
        {/* Filter Toolbar */}
        <div className="p-3 bg-white border-b border-slate-100">
          <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Admin Identifier
              </label>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="ID or Name..." 
                  value={adminUserId}
                  onChange={(e) => setAdminUserId(e.target.value)}
                  className="pl-9 h-10 w-full text-xs border-slate-200 focus:ring-indigo-500 rounded-xl bg-white shadow-sm font-medium"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Operation Action
              </label>
              <Select value={action} onValueChange={(val) => setAction(val || 'ALL')}>
                <SelectTrigger className="w-full bg-white border-slate-200 !h-10 shadow-sm rounded-xl font-bold text-xs">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ALL PERMISSIONS</SelectItem>
                  <SelectItem value="CREATE_ADMINS">CREATE_ADMINS</SelectItem>
                  <SelectItem value="MANAGE_STAFF">MANAGE_STAFF</SelectItem>
                  <SelectItem value="DELETE_ADMINS">DELETE_ADMINS</SelectItem>
                  <SelectItem value="APPROVE_KYC">APPROVE_KYC</SelectItem>
                  <SelectItem value="REJECT_KYC">REJECT_KYC</SelectItem>
                  <SelectItem value="MANAGE_SYSTEM_ROLES">MANAGE_SYSTEM_ROLES</SelectItem>
                  <SelectItem value="MANAGE_SYSTEM_PERMISSIONS">MANAGE_SYSTEM_PERMISSIONS</SelectItem>
                  <SelectItem value="ASSIGN_STAFF_ROLES">ASSIGN_STAFF_ROLES</SelectItem>
                  <SelectItem value="FREEZE_USERS">FREEZE_USERS</SelectItem>
                  <SelectItem value="UNFREEZE_USERS">UNFREEZE_USERS</SelectItem>
                  <SelectItem value="RESET_STAFF_PASSWORD">RESET_STAFF_PASSWORD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Resource Type
              </label>
              <Select value={resourceType} onValueChange={(val) => setResourceType(val || 'ALL')}>
                <SelectTrigger className="w-full bg-white border-slate-200 !h-10 shadow-sm rounded-xl font-bold text-xs">
                  <SelectValue placeholder="All Resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ALL RESOURCES</SelectItem>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="KYC_DOCUMENT">KYC_DOCUMENT</SelectItem>
                  <SelectItem value="ADMIN_USER">ADMIN_USER</SelectItem>
                  <SelectItem value="ACCOUNT">ACCOUNT</SelectItem>
                  <SelectItem value="TRANSACTION">TRANSACTION</SelectItem>
                  <SelectItem value="PII">PII</SelectItem>
                  <SelectItem value="RECONCILIATION_REPORT">RECONCILIATION</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 flex gap-2 w-full h-10">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClearFilters}
                className="flex-1 h-10 text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-xl border-slate-200"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
              <Button type="submit" disabled={loading} className="flex-[2] h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95">
                <Search className="w-4 h-4 mr-1" />
                Search
              </Button>
            </div>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                <th className="px-6 py-2.5 border-r border-slate-200/60 text-left">Execution Time</th>
                <th className="px-6 py-2.5 text-center border-r border-slate-200/60">Actor</th>
                <th className="px-6 py-2.5 text-center border-r border-slate-200/60">Action</th>
                <th className="px-6 py-2.5 text-center border-r border-slate-200/60">Description</th>
                <th className="px-6 py-2.5 text-center border-r border-slate-200/60">Target Resource</th>
                <th className="px-6 py-2.5 text-center">Intel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 h-16 bg-slate-50/10" />
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No audit records found matching your selection.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-2 border-r border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}</span>
                        <span className="text-[10px] text-slate-400 font-mono tracking-tighter">{format(new Date(log.createdAt), 'yyyy')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-2 border-r border-slate-100 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                            <Cpu className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-slate-700 leading-tight">Admin System</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-2 border-r border-slate-100">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`px-2 py-0.5 w-fit rounded-md text-[9px] font-black uppercase tracking-wider border ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <div className="flex items-center gap-1">
                          <div className={`w-1 h-1 rounded-full ${log.responseStatus >= 400 ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                          <span className={`text-[9px] font-bold ${getStatusColor(log.responseStatus)}`}>
                            {log.responseStatus}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-2 border-r border-slate-100 text-center">
                      {log.reason && (
                        <span className="text-[10px] font-bold text-slate-700 leading-tight block max-w-[150px] mx-auto" title={log.reason}>
                          {log.reason}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-2 border-r border-slate-100">
                      <div className="flex items-center justify-center gap-2">
                        <div className="p-1 bg-slate-50 rounded-lg text-slate-400 border border-slate-100">
                          {getResourceIcon(log.resourceType)}
                        </div>
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{log.resourceType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-2 text-center">
                      <Dialog>
                        <DialogTrigger render={
                          <Button variant="outline" size="sm" onClick={() => setSelectedLog(log)} className="h-7 px-3 rounded-lg text-[9px] font-bold border-slate-200 hover:bg-slate-50 hover:border-indigo-200 transition-all active:scale-95 group/btn">
                            Inspect
                            <ChevronRight className="w-3 h-3 ml-1 text-slate-300 group-hover/btn:text-indigo-400 transition-colors" />
                          </Button>
                        } />
                        <DialogContent className="sm:max-w-3xl bg-white rounded-2xl border-0 shadow-2xl overflow-hidden">
                          <DialogHeader className="bg-slate-50/50 p-6 border-b border-slate-100">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                              <Terminal className="w-5 h-5 text-indigo-600" />
                              Audit Log Intel
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                              Complete trace of the administrative mutation and payload.
                            </DialogDescription>
                          </DialogHeader>
                          {selectedLog && (
                            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                                <div className="space-y-4">
                                  <div>
                                    <p className="font-black text-slate-400 uppercase tracking-widest text-[9px] mb-1">Request Intel</p>
                                    <div className="space-y-1.5 font-bold text-slate-700">
                                      <p className="flex justify-between border-b border-slate-50 pb-1">
                                        <span>Actor Name:</span>
                                        <span>Admin System</span>
                                      </p>
                                      <p className="flex justify-between border-b border-slate-50 pb-1">
                                        <span>Actor ID:</span>
                                        <span className="font-mono text-[10px] text-slate-400">{selectedLog.adminUserId}</span>
                                      </p>
                                      <p className="flex justify-between border-b border-slate-50 pb-1">
                                        <span>IP Address:</span>
                                        <span className="font-mono text-indigo-600">{selectedLog.ipAddress}</span>
                                      </p>
                                      <p className="flex justify-between border-b border-slate-50 pb-1">
                                        <span>Method:</span>
                                        <span>{selectedLog.action}</span>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <div>
                                    <p className="font-black text-slate-400 uppercase tracking-widest text-[9px] mb-1">Target Context</p>
                                    <div className="space-y-1.5 font-bold text-slate-700">
                                      <p className="flex justify-between border-b border-slate-50 pb-1">
                                        <span>Type:</span>
                                        <span className="uppercase text-indigo-600">{selectedLog.resourceType}</span>
                                      </p>
                                      <p className="flex justify-between border-b border-slate-50 pb-1">
                                        <span>Identifier:</span>
                                        <span className="font-mono text-slate-500">{selectedLog.resourceId || 'N/A'}</span>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <p className="font-black text-slate-400 uppercase tracking-widest text-[9px] mb-1">User Agent</p>
                                  <p className="text-[10px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    {selectedLog.userAgent}
                                  </p>
                                </div>
                              </div>

                              {selectedLog.requestPayload && (
                                <div className="space-y-2">
                                  <p className="font-black text-slate-400 uppercase tracking-widest text-[9px] ml-1">Request Payload</p>
                                  <div className="p-4 bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                                    <pre className="text-[10px] text-emerald-400 font-mono overflow-x-auto custom-scrollbar leading-relaxed">
                                      {JSON.stringify(selectedLog.requestPayload, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {selectedLog.changes && (
                                <div className="space-y-2">
                                  <p className="font-black text-slate-400 uppercase tracking-widest text-[9px] ml-1 text-amber-500">Resource Mutation (Changes)</p>
                                  <div className="p-4 bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                                    <pre className="text-[10px] text-amber-400 font-mono overflow-x-auto custom-scrollbar leading-relaxed">
                                      {JSON.stringify(selectedLog.changes, null, 2)}
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

        {/* Pagination UI */}
        {totalPages > 0 && (
          <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Showing page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{totalPages}</strong> 
              <span className="hidden sm:inline"> ({total} total audit records)</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1 || loading}
                className="h-8 px-3 text-xs font-bold rounded-lg border-slate-200 text-slate-600"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages || loading}
                className="h-8 px-3 text-xs font-bold rounded-lg border-slate-200 text-slate-600"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

