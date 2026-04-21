import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/lib/admin-api';

async function getSuspiciousActivities() {
  try {
    const response = await adminApi.aml.findAll({ page: 1, limit: 50 });
    return response.data || [];
  } catch (error) {
    console.error('[AML_PAGE] Fetch error:', error);
    return [];
  }
}

export default async function AMLPage() {
  const activities = await getSuspiciousActivities();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-[#2D3748]">AML Suspicious Activity Monitor</h2>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Suspicious Activities</CardTitle>
          <CardDescription>
            Monitor and review suspicious activities flagged by the AML detection system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left font-medium">Activity Type</th>
                  <th className="p-4 text-left font-medium">User ID</th>
                  <th className="p-4 text-left font-medium">Risk Score</th>
                  <th className="p-4 text-left font-medium">Status</th>
                  <th className="p-4 text-left font-medium">Created</th>
                  <th className="p-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No suspicious activities found
                    </td>
                  </tr>
                ) : (
                  activities.map((activity: any) => (
                    <tr key={activity.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">{activity.activityType}</td>
                      <td className="p-4">{activity.userId}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          activity.riskScore >= 75 ? 'bg-red-100 text-red-800' :
                          activity.riskScore >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {activity.riskScore}
                        </span>
                      </td>
                      <td className="p-4">{activity.status}</td>
                      <td className="p-4">{new Date(activity.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <button className="text-sm text-blue-600 hover:text-blue-800 mr-2">
                          Review
                        </button>
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
