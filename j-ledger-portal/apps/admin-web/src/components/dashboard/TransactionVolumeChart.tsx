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
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface ChartData {
  time: string;
  volume: number;
}

interface TransactionVolumeChartProps {
  data: ChartData[];
  dateRange: string;
  onDateRangeChange: (val: string) => void;
  isLoading?: boolean;
}

export function TransactionVolumeChart({
  data = [],
  dateRange,
  onDateRangeChange,
  isLoading,
}: TransactionVolumeChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalTransactions = data.reduce(
    (sum, item) => sum + (item.volume || 0),
    0,
  );

  if (!mounted || isLoading) {
    return (
      <Card className="border border-border/80 shadow-md shadow-slate-200/40 dark:shadow-none hover:shadow-lg hover:border-indigo-500/20 transition-all duration-300 rounded-xl bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm font-semibold text-foreground">
              Transaction Volume
            </CardTitle>
            <InfoTooltip
              content="จำนวนธุรกรรมทั้งหมดที่เกิดขึ้นในระบบตามช่วงเวลาที่เลือก รวมทุกประเภท เช่น เติมเงิน โอน และชำระเงิน"
              iconClassName="text-muted-foreground hover:text-foreground"
            />
          </div>
          <div className="w-[120px] h-7 bg-muted animate-pulse rounded-lg" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-1 mb-4">
            <div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-40 bg-muted animate-pulse rounded-md" />
          </div>
          <div className="h-[200px] w-full bg-slate-50/50 dark:bg-slate-900/30 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/80 shadow-md shadow-slate-200/40 dark:shadow-none hover:shadow-lg hover:border-indigo-500/20 transition-all duration-300 rounded-xl bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-sm font-semibold text-foreground">
            Transaction Volume
          </CardTitle>
          <InfoTooltip
            content="จำนวนธุรกรรมทั้งหมดที่เกิดขึ้นในระบบตามช่วงเวลาที่เลือก รวมทุกประเภท เช่น เติมเงิน โอน และชำระเงิน"
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

      <CardContent className="pt-1">
        {/* Dynamic header value panel matching mockup */}
        <div className="flex items-baseline gap-2.5 mb-5 mt-1">
          <span className="text-3xl font-extrabold text-foreground tracking-tight">
            {totalTransactions}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-muted-foreground tracking-wide">
              Total Transactions
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              +15.6%{' '}
              <span className="font-medium text-muted-foreground text-[8px] ml-0.5">
                vs last 30 days
              </span>
            </span>
          </div>
        </div>

        {/* Dynamic Sparkline Area Chart */}
        <div className="h-[210px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="colorVolumeFull"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E2E8F0"
                className="dark:stroke-slate-800"
              />
              <XAxis
                dataKey="time"
                stroke="#94A3B8"
                fontSize={10}
                fontWeight={600}
                tickLine={false}
                axisLine={false}
                dy={8}
                interval={data.length === 24 ? 3 : data.length === 30 ? 5 : 2}
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={10}
                fontWeight={600}
                tickLine={false}
                axisLine={false}
                dx={-8}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFF',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                itemStyle={{
                  color: '#1E293B',
                  fontWeight: 600,
                  fontSize: '11px',
                }}
                labelStyle={{
                  color: '#64748B',
                  fontWeight: 600,
                  fontSize: '10px',
                  marginBottom: '2px',
                }}
              />
              <Area
                type="monotone"
                dataKey="volume"
                name="Transactions"
                stroke="#2563eb"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorVolumeFull)"
                activeDot={{
                  r: 5,
                  strokeWidth: 2,
                  stroke: '#FFFFFF',
                  fill: '#2563eb',
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
