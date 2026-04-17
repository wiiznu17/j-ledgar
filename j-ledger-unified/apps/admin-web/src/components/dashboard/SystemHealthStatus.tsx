import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface SystemHealthStatusProps {
  isOnline: boolean;
}

export function SystemHealthStatus({ isOnline }: SystemHealthStatusProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">System Health</CardTitle>
        <Activity className={`h-4 w-4 ${isOnline ? 'text-green-500' : 'text-red-500'}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {isOnline ? 'All microservices operational' : 'Connection issues detected'}
        </p>
      </CardContent>
    </Card>
  );
}
