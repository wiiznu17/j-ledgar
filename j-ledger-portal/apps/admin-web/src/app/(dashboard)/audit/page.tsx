import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/lib/admin-api';

async function getAuditLogs() {
  try {
    const response = await adminApi.audit.findAll({ page: 1, limit: 50 });
    return response.data || [];
  } catch (error) {
    console.error('[AUDIT_PAGE] Fetch error:', error);
    return [];
  }
}

export default async function AuditPage() {
  const logs = await getAuditLogs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-[#2D3748]">Audit Logs</h2>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Admin Action History</CardTitle>
          <CardDescription>
            Complete audit trail of all administrative actions performed in the system.
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
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log: any) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 text-sm">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 text-sm font-medium">{log.adminUserId}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                          log.action === 'UPDATE' ? 'bg-yellow-100 text-yellow-800' :
                          log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-sm">{log.resourceType}</td>
                      <td className="p-4 text-sm font-mono text-xs">{log.resourceId}</td>
                      <td className="p-4 text-sm font-mono text-xs">{log.ipAddress}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          log.responseStatus >= 200 && log.responseStatus < 300 ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {log.responseStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
