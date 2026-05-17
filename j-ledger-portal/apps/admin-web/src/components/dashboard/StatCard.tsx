import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  iconClassName?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName = 'text-accent',
  className,
}: StatCardProps) {
  return (
    <Card className={`border border-border bg-card text-card-foreground shadow-xs rounded-xl ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconClassName}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-right">{value}</div>
        <p className="text-xs text-muted-foreground mt-1 text-left">{description}</p>
      </CardContent>
    </Card>
  );
}
