'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { useEffect, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface DistributionData {
  name: string;
  value: number;
}

interface TransactionDistributionChartProps {
  data: DistributionData[];
  dateRange: string;
  onDateRangeChange: (val: string) => void;
  isLoading?: boolean;
}

// Colors matching the mockup exactly
const COLOR_MAP: Record<string, string> = {
  Transfer: '#8b5cf6', // Violet
  Payment: '#10b981', // Green
  'Top Up': '#f59e0b', // Amber
  Withdrawal: '#3b82f6', // Blue
  Other: '#64748b', // Slate
};

export function TransactionDistributionChart({
  data = [],
  dateRange,
  onDateRangeChange,
  isLoading,
}: TransactionDistributionChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalValue = data.reduce((sum, item) => sum + (item.value || 0), 0);
  const isAllZero = totalValue === 0;

  // Clean data for Recharts Pie
  const displayData = isAllZero
    ? [{ name: 'No Activity', value: 1, color: '#E2E8F0' }]
    : data.map((item) => ({
        name: item.name,
        value: item.value,
        color: COLOR_MAP[item.name] || '#64748b',
      }));

  if (!mounted || isLoading) {
    return (
      <Card className="border border-border/80 shadow-md shadow-slate-200/40 dark:shadow-none hover:shadow-lg hover:border-indigo-500/20 transition-all duration-300 rounded-xl bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm font-semibold text-foreground">
              Transaction Distribution
            </CardTitle>
            <InfoTooltip
              content="สัดส่วนประเภทธุรกรรมทั้งหมด แสดงเปอร์เซ็นต์การเติมเงิน โอน ชำระเงิน และถอนเงิน"
              iconClassName="text-muted-foreground hover:text-foreground"
            />
          </div>
          <div className="w-[120px] h-7 bg-muted animate-pulse rounded-lg" />
        </CardHeader>
        <CardContent>
          <div className="h-[210px] w-full bg-slate-50/50 dark:bg-slate-900/30 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/80 shadow-md shadow-slate-200/40 dark:shadow-none hover:shadow-lg hover:border-indigo-500/20 transition-all duration-300 rounded-xl bg-card h-full flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-sm font-semibold text-foreground">
            Transaction Distribution
          </CardTitle>
          <InfoTooltip
            content="สัดส่วนประเภทธุรกรรมทั้งหมด แสดงเปอร์เซ็นต์การเติมเงิน โอน ชำระเงิน และถอนเงิน"
            iconClassName="text-muted-foreground hover:text-foreground"
          />
        </div>
        <div className="flex items-center bg-card rounded-lg border border-border p-1 shadow-xs hover:border-muted-foreground/30 transition-colors">
          <Select
            value={dateRange}
            onValueChange={(val) => val && onDateRangeChange(val)}
          >
            <SelectTrigger className="w-[100px] border-none focus:ring-0 focus:outline-hidden focus-visible:ring-0 shadow-none h-7 text-xs font-semibold text-foreground bg-transparent py-0">
              <CalendarIcon className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="30d">30D</SelectItem>
              <SelectItem value="1y">1Y</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex items-center justify-center py-4">
        {/* Horizontal flex container to put Donut on left and Legend on right */}
        <div className="flex flex-row items-center justify-between gap-6 w-full max-w-[340px]">
          {/* Donut Container */}
          <div className="relative w-[130px] h-[130px] shrink-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={displayData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={isAllZero ? 0 : 3}
                  dataKey="value"
                  stroke="none"
                >
                  {displayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                {!isAllZero && (
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                )}
              </PieChart>
            </ResponsiveContainer>

            {/* Center Text displaying dynamic Total */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                Total
              </span>
              <span className="text-2xl font-black text-foreground leading-none">
                {totalValue}
              </span>
            </div>
          </div>

          {/* Legend Column on the right */}
          <div className="flex-1 flex flex-col gap-2">
            {data.map((item, idx) => {
              const color = COLOR_MAP[item.name] || '#64748b';
              const pct =
                totalValue > 0
                  ? ((item.value / totalValue) * 100).toFixed(1)
                  : '0.0';

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-slate-500 font-bold">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 text-right">
                    <span className="text-foreground font-extrabold">
                      {item.value}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-medium">
                      ({pct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
