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
import { userRequester } from '@/lib/requesters';
import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  RotateCcw,
  Filter,
  ShieldAlert,
  Activity,
  Eye,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  FilterSearchInput,
  FilterSelect,
  FilterActions,
} from '@/components/common/FilterElements';
import { TablePagination } from '@/components/common/TablePagination';

export default function UserActivityPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Filters
  const [userId, setUserId] = useState(searchParams.get('userId') || '');
  const [eventType, setEventType] = useState<string>('ALL');

  const limit = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userRequester.getSecurityEvents({
        params: {
          page: String(page),
          limit: String(limit),
          ...(userId ? { userId } : {}),
          ...(eventType !== 'ALL' ? { eventType } : {}),
        },
      });
      setLogs(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotal(response.pagination?.total || 0);
    } catch (error) {
      console.error('[USER_ACTIVITY_PAGE] Fetch error:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, userId, eventType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setUserId('');
    setEventType('ALL');
    setPage(1);
    router.push('/users/activity');
  };

  const getEventColor = (type: string) => {
    if (
      type.includes('FAILURE') ||
      type.includes('LOCKED') ||
      type.includes('SUSPICIOUS')
    ) {
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
    }
    if (
      type.includes('SUCCESS') ||
      type.includes('COMPLETED') ||
      type.includes('VERIFIED')
    ) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    }
    return 'bg-muted text-muted-foreground border-border border';
  };

  return (
    <div className="space-y-4 pb-10 text-foreground">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          User Activity Logs
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor real-time security events and identity transactions.
        </p>
      </div>

      {/* Security Overview Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-xl shadow-xs border border-border text-card-foreground">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-bold text-foreground">
            Security Pulse
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-4 md:gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-muted-foreground font-medium">
              Failed Logins:{' '}
              <strong className="text-foreground">
                {logs.filter((l) => l.eventType === 'LOGIN_FAILURE').length}+
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground font-medium">
              Successful Logins:{' '}
              <strong className="text-foreground">
                {logs.filter((l) => l.eventType === 'LOGIN_SUCCESS').length}+
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-muted-foreground font-medium">
              Device Changes:{' '}
              <strong className="text-foreground">
                {logs.filter((l) => l.eventType === 'DEVICE_REGISTERED').length}
                +
              </strong>
            </span>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-xs rounded-xl overflow-hidden bg-card text-card-foreground">
        {/* Filter Toolbar */}
        <div className="p-3 bg-card border-b border-border">
          <form
            onSubmit={handleFilter}
            className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
          >
            <FilterSearchInput
              label="Wallet User Identifier"
              placeholder="ID, Email, or Phone..."
              value={userId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserId(e.target.value)}
              className="md:col-span-2"
            />

            <FilterSelect
              label="Event Classification"
              value={eventType}
              onValueChange={(val: string) => setEventType(val || 'ALL')}
              options={[
                { label: 'ALL CATEGORIES', value: 'ALL' },
                { label: 'LOGIN SUCCESS', value: 'LOGIN_SUCCESS' },
                { label: 'LOGIN FAILURE', value: 'LOGIN_FAILURE' },
                { label: 'PIN LOCKED', value: 'PIN_LOCKED' },
                { label: 'SUSPICIOUS ACTIVITY', value: 'SUSPICIOUS_ACTIVITY' },
                { label: 'DEVICE REGISTERED', value: 'DEVICE_REGISTERED' },
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
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User Subject</th>
                <th className="px-6 py-4">Event Type</th>
                <th className="px-6 py-4">Security Intel</th>
                <th className="px-6 py-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 h-16 bg-muted/10" />
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-muted-foreground font-medium"
                  >
                    No security events matches your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr
                    key={log.id}
                    className="hover:bg-muted/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">
                          {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono tracking-tighter">
                          {format(new Date(log.createdAt), 'yyyy')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-indigo-500/10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground leading-tight">
                            {log.user?.email ||
                              log.user?.phoneNumber ||
                              'Unknown Identity'}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]">
                            {log.userId}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${getEventColor(log.eventType)}`}
                      >
                        {log.eventType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                          <Lock className="w-3 h-3" />
                          {log.metadata?.ipAddress || 'Internal Source'}
                        </div>
                        <span className="text-[10px] text-muted-foreground italic truncate max-w-[200px]">
                          {log.metadata?.userAgent || 'System Process'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Dialog>
                        <DialogTrigger
                          render={
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                              className="h-8 rounded-lg text-[10px] font-bold border-border hover:bg-muted bg-card text-foreground"
                            >
                              Inspect
                            </Button>
                          }
                        />
                        <DialogContent className="max-w-md bg-card text-card-foreground rounded-2xl border-0 shadow-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                              <ShieldAlert className="w-5 h-5 text-indigo-600" />
                              Technical Intel
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                              Detailed cryptographic and session metadata for
                              this event.
                            </DialogDescription>
                          </DialogHeader>
                          {selectedLog && (
                            <div className="space-y-5 py-4">
                              <div className="grid grid-cols-2 gap-y-4 text-xs">
                                <div>
                                  <p className="font-black text-muted-foreground uppercase tracking-widest text-[9px] mb-1">
                                    Status Code
                                  </p>
                                  <p className="font-bold text-foreground">
                                    200 OK
                                  </p>
                                </div>
                                <div>
                                  <p className="font-black text-muted-foreground uppercase tracking-widest text-[9px] mb-1">
                                    Identity Provider
                                  </p>
                                  <p className="font-bold text-foreground">
                                    Local Auth
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="font-black text-muted-foreground uppercase tracking-widest text-[9px] ml-1">
                                  Event Payload
                                </p>
                                <div className="p-4 bg-slate-950 rounded-xl overflow-hidden">
                                  <pre className="text-[10px] text-indigo-300 font-mono overflow-x-auto custom-scrollbar leading-relaxed">
                                    {JSON.stringify(
                                      selectedLog.metadata,
                                      null,
                                      2,
                                    )}
                                  </pre>
                                </div>
                              </div>
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
