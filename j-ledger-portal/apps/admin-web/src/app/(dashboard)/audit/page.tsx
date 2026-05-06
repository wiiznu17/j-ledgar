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
import { ChevronLeft, ChevronRight, Search, RotateCcw, Filter, History, Eye, ShieldAlert, Cpu, Terminal, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
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
  }, [fetchLogs]);

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

  const getActionColor = (act: string) => {
    switch (act) {
      case 'DELETE': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'UPDATE': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'CREATE': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusColor = (status: number) => {
    return status >= 200 && status < 300
      ? 'text-emerald-600'
      : 'text-rose-500';
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
            <span className="text-slate-500 font-medium">Creations: <strong className="text-slate-800">{logs.filter(l => l.action === 'CREATE').length}+</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-500 font-medium">Updates: <strong className="text-slate-800">{logs.filter(l => l.action === 'UPDATE').length}+</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-slate-500 font-medium">Deletions: <strong className="text-slate-800">{logs.filter(l => l.action === 'DELETE').length}+</strong></span>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
        {/* Filter Toolbar */}
        <div className="p-3 bg-white border-b border-slate-100">
          <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Admin Identifier
              </Label>
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
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Operation Action
              </Label>
              <Select value={action} onValueChange={(val) => setAction(val || 'ALL')}>
                <SelectTrigger className="w-full bg-white border-slate-200 !h-10 shadow-sm rounded-xl font-bold text-xs">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Actions</SelectItem>
                  <SelectItem value="CREATE">CREATE</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="VIEW">VIEW</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Resource Type
              </Label>
              <Select value={resourceType} onValueChange={(val) => setResourceType(val || 'ALL')}>
                <SelectTrigger className="w-full bg-white border-slate-200 !h-10 shadow-sm rounded-xl font-bold text-xs">
                  <SelectValue placeholder="All Resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Resources</SelectItem>
                  <SelectItem value="ACCOUNT">ACCOUNT</SelectItem>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="ADMIN_USER">ADMIN_USER</SelectItem>
                  <SelectItem value="TRANSACTION">TRANSACTION</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 flex gap-2 w-full h-10">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleClearFilters}
                className="flex-1 h-10 text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-xl border-slate-200"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
              <Button type="submit" size="sm" className="flex-[2] h-10 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold rounded-xl shadow-lg shadow-indigo-200 text-white">
                <Filter className="w-4 h-4 mr-1" />
                Apply Filters
              </Button>
            </div>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                <th className="px-6 py-4">Execution Time</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Operation</th>
                <th className="px-6 py-4">Target Resource</th>
                <th className="px-6 py-4 text-right">Intel</th>
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
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}</span>
                        <span className="text-[10px] text-slate-400 font-mono tracking-tighter">{format(new Date(log.createdAt), 'yyyy')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                          <Cpu className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700 leading-tight">Admin System</span>
                          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                            {log.adminUserId}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className={`px-2 py-0.5 w-fit rounded-md text-[10px] font-black uppercase tracking-wider border ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className={`text-[10px] font-bold ${getStatusColor(log.responseStatus)}`}>
                          Status: {log.responseStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.resourceType}</span>
                        <span className="text-xs font-mono text-slate-700 tracking-tighter bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                          {log.resourceId || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Dialog>
                        <DialogTrigger render={
                          <Button variant="outline" size="sm" onClick={() => setSelectedLog(log)} className="h-8 rounded-lg text-[10px] font-bold border-slate-200 hover:bg-slate-50">
                            Inspect
                          </Button>
                        } />
                        <DialogContent className="max-w-2xl bg-white rounded-2xl border-0 shadow-2xl overflow-hidden">
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

