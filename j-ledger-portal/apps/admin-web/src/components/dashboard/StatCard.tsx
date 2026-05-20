import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  iconClassName?: string;
  className?: string;
  trendText?: string;
  trendSub?: string;
  trendType?: 'up' | 'down' | 'neutral';
  isLoading?: boolean;
  tagText?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName = 'text-indigo-600 dark:text-indigo-400',
  className = '',
  trendText,
  trendSub,
  trendType = 'up',
  isLoading = false,
  tagText,
}: StatCardProps) {
  // Determine trend background and text colors
  const isUp = trendType === 'up';
  const isDown = trendType === 'down';
  const trendBg = isUp
    ? 'bg-emerald-500/10 dark:bg-emerald-500/20'
    : isDown
      ? 'bg-red-500/10 dark:bg-red-500/20'
      : 'bg-slate-500/10';
  const trendTextColor = isUp
    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
    : isDown
      ? 'text-red-600 dark:text-red-400 font-bold'
      : 'text-muted-foreground';

  if (isLoading) {
    return (
      <Card
        className={`border border-border/80 bg-card text-card-foreground shadow-xs rounded-xl ${className}`}
      >
        <CardContent className="p-4 py-3.5 flex items-start gap-4.5 h-full justify-between animate-pulse">
          <div className="flex items-center gap-3 w-full">
            <div className="w-9.5 h-9.5 rounded-full bg-muted shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-2.5 w-14 bg-muted rounded-md" />
              <div className="h-5 w-20 bg-muted rounded-md" />
              <div className="h-2.5 w-28 bg-muted rounded-md" />
            </div>
          </div>
          <div className="space-y-1 flex flex-col items-end shrink-0 pt-0.5">
            <div className="h-3.5 w-10 bg-muted rounded-full" />
            <div className="h-3 w-14 bg-muted rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`border border-border bg-card text-card-foreground shadow-xs rounded-xl hover:shadow-md transition-all duration-300 ${className}`}
    >
      <CardContent className="p-4 py-3.5 flex items-start gap-3.5 h-full justify-between">
        {/* Left side: Icon inside circular container */}
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-full flex items-center justify-center bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30 shrink-0 ${iconClassName}`}
          >
            <Icon className="h-4.5 w-4.5" />
          </div>

          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
              {title}
              {tagText && (
                <span className="text-[8px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1 py-0.5 rounded font-black tracking-wider uppercase shrink-0">
                  {tagText}
                </span>
              )}
            </span>
            <span className="block text-xl font-black text-foreground tracking-tight leading-none my-0.5">
              {value}
            </span>
            <span className="block text-[10px] font-medium text-muted-foreground">
              {description}
            </span>
          </div>
        </div>

        {/* Right side: Growth Trend Pills */}
        {trendText && (
          <div className="flex flex-col items-end gap-1 self-start pt-0.5">
            <div
              className={`px-2 py-0.5 rounded-full text-[9px] ${trendBg} ${trendTextColor}`}
            >
              {trendText}
            </div>
            {trendSub && (
              <span className="text-[8px] font-medium text-muted-foreground">
                {trendSub}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
