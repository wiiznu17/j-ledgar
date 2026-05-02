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
import { userRequester } from '@/lib/requesters';
import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Search, X, ShieldAlert } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

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
  const [eventType, setEventType] = useState<string | null>(null);

  const limit = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userRequester.getSecurityEvents({
        params: {
          page: String(page),
          limit: String(limit),
          ...(userId ? { userId } : {}),
          ...(eventType ? { eventType } : {}),
        }
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

  const handleFilter = () => {
    setPage(1);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setUserId('');
    setEventType(null);
    setPage(1);
    router.push('/users/activity');
  };

  const getEventColor = (type: string) => {
    if (type.includes('FAILURE') || type.includes('LOCKED') || type.includes('SUSPICIOUS')) {
      return 'bg-red-100 text-red-800';
    }
    if (type.includes('SUCCESS') || type.includes('COMPLETED') || type.includes('VERIFIED')) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-[#2D3748]">User Activity Logs</h2>
      </div>

      {/* Filters */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Security Event Filters</CardTitle>
          <CardDescription>
            Search for specific user activities across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="userId">Wallet User ID</Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID"
              />
            </div>
            <div>
              <Label htmlFor="eventType">Event Type</Label>
              <Select value={eventType || ''} onValueChange={(val) => setEventType(val || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All Events</SelectItem>
                  <SelectItem value="LOGIN_SUCCESS">LOGIN_SUCCESS</SelectItem>
                  <SelectItem value="LOGIN_FAILURE">LOGIN_FAILURE</SelectItem>
                  <SelectItem value="PIN_LOCKED">PIN_LOCKED</SelectItem>
                  <SelectItem value="SUSPICIOUS_ACTIVITY">SUSPICIOUS_ACTIVITY</SelectItem>
                  <SelectItem value="DEVICE_REGISTERED">DEVICE_REGISTERED</SelectItem>
                  <SelectItem value="REGISTRATION_COMPLETED">REGISTRATION_COMPLETED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleFilter} className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Apply Filters
            </Button>
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" />
            <CardTitle>User Activity Feed</CardTitle>
          </div>
          <CardDescription>
            Real-time feed of user-triggered security and identity events. Total: {total} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/30">
                  <th className="p-4 text-left font-semibold">Timestamp</th>
                  <th className="p-4 text-left font-semibold">User</th>
                  <th className="p-4 text-left font-semibold">Event Type</th>
                  <th className="p-4 text-left font-semibold">IP Address</th>
                  <th className="p-4 text-left font-semibold">Metadata</th>
                  <th className="p-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Loading user activities...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No security events found
                    </td>
                  </tr>
                ) : (
                  logs.map((log: any) => (
                    <tr key={log.id} className="border-b hover:bg-secondary/10 transition-colors">
                      <td className="p-4 text-muted-foreground font-mono text-xs">
                        {new Date(log.createdAt).toLocaleString('en-GB')}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-[#2D3748]">
                            {log.user?.email || log.user?.phoneNumber || 'Unknown User'}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
                            {log.userId}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getEventColor(log.eventType)}`}
                        >
                          {log.eventType}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs text-muted-foreground">
                        {log.metadata?.ipAddress || 'N/A'}
                      </td>
                      <td className="p-4 max-w-[200px] truncate text-xs text-muted-foreground">
                        {JSON.stringify(log.metadata)}
                      </td>
                      <td className="p-4 text-right">
                        <Dialog>
                          <DialogTrigger render={<Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)} />}>
                            Details
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Event Details</DialogTitle>
                              <DialogDescription>
                                Full technical metadata for this security event.
                              </DialogDescription>
                            </DialogHeader>
                            {selectedLog && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                  <div className="font-semibold text-slate-500">Timestamp</div>
                                  <div>{new Date(selectedLog.createdAt).toLocaleString()}</div>
                                  
                                  <div className="font-semibold text-slate-500">User ID</div>
                                  <div className="font-mono text-xs">{selectedLog.userId}</div>
                                  
                                  <div className="font-semibold text-slate-500">Event Type</div>
                                  <div>{selectedLog.eventType}</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="font-semibold text-sm text-slate-500">Metadata (JSON)</div>
                                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[10px] overflow-x-auto">
                                    {JSON.stringify(selectedLog.metadata, null, 2)}
                                  </pre>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} records)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
