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
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Filters
  const [adminUserId, setAdminUserId] = useState('');
  const [action, setAction] = useState<string | null>(null);
  const [resourceType, setResourceType] = useState<string | null>(null);
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
        action: action || undefined,
        resourceType: resourceType || undefined,
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

  const handleFilter = () => {
    setPage(1);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setAdminUserId('');
    setAction(null);
    setResourceType(null);
    setStartDate('');
    setEndDate('');
    setPage(1);
    fetchLogs();
  };

  const getActionColor = (act: string) => {
    switch (act) {
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'UPDATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusColor = (status: number) => {
    return status >= 200 && status < 300
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-[#2D3748]">Audit Logs</h2>
      </div>

      {/* Filters */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="adminUserId">Admin User ID</Label>
              <Input
                id="adminUserId"
                value={adminUserId}
                onChange={(e) => setAdminUserId(e.target.value)}
                placeholder="Enter admin user ID"
              />
            </div>
            <div>
              <Label htmlFor="action">Action</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  <SelectItem value="CREATE">CREATE</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="VIEW">VIEW</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="resourceType">Resource Type</Label>
              <Select value={resourceType} onValueChange={setResourceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Resources</SelectItem>
                  <SelectItem value="ACCOUNT">ACCOUNT</SelectItem>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="ADMIN_USER">ADMIN_USER</SelectItem>
                  <SelectItem value="SUSPICIOUS_ACTIVITY">SUSPICIOUS_ACTIVITY</SelectItem>
                  <SelectItem value="TRANSACTION">TRANSACTION</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
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

      {/* Audit Logs Table */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Admin Action History</CardTitle>
          <CardDescription>
            Complete audit trail of all administrative actions performed in the system. Total:{' '}
            {total} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left font-medium">Timestamp</th>
                  <th className="p-4 text-left font-medium">Admin User</th>
                  <th className="p-4 text-left font-medium">Action</th>
                  <th className="p-4 text-left font-medium">Resource Type</th>
                  <th className="p-4 text-left font-medium">Resource ID</th>
                  <th className="p-4 text-left font-medium">IP Address</th>
                  <th className="p-4 text-left font-medium">Status</th>
                  <th className="p-4 text-left font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log: any) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 text-sm">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="p-4 text-sm font-medium">{log.adminUserId}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getActionColor(log.action)}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-sm">{log.resourceType}</td>
                      <td className="p-4 text-sm font-mono text-xs">{log.resourceId}</td>
                      <td className="p-4 text-sm font-mono text-xs">{log.ipAddress}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(log.responseStatus)}`}
                        >
                          {log.responseStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        <Dialog>
                          <DialogTrigger>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Audit Log Details</DialogTitle>
                              <DialogDescription>
                                Detailed information about this administrative action
                              </DialogDescription>
                            </DialogHeader>
                            {selectedLog && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="font-semibold">Timestamp</Label>
                                    <p className="text-sm">
                                      {new Date(selectedLog.createdAt).toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold">Admin User ID</Label>
                                    <p className="text-sm">{selectedLog.adminUserId}</p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold">Action</Label>
                                    <p className="text-sm">{selectedLog.action}</p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold">Resource Type</Label>
                                    <p className="text-sm">{selectedLog.resourceType}</p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold">Resource ID</Label>
                                    <p className="text-sm font-mono">{selectedLog.resourceId}</p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold">IP Address</Label>
                                    <p className="text-sm font-mono">{selectedLog.ipAddress}</p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold">User Agent</Label>
                                    <p className="text-sm break-all">{selectedLog.userAgent}</p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold">Response Status</Label>
                                    <p className="text-sm">{selectedLog.responseStatus}</p>
                                  </div>
                                </div>
                                {selectedLog.reason && (
                                  <div>
                                    <Label className="font-semibold">Reason</Label>
                                    <p className="text-sm">{selectedLog.reason}</p>
                                  </div>
                                )}
                                {selectedLog.requestPayload && (
                                  <div>
                                    <Label className="font-semibold">Request Payload</Label>
                                    <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                                      {JSON.stringify(selectedLog.requestPayload, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {selectedLog.changes && (
                                  <div>
                                    <Label className="font-semibold">Changes</Label>
                                    <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                                      {JSON.stringify(selectedLog.changes, null, 2)}
                                    </pre>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} total records)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
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
