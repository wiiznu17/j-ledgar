'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ChartData {
  time: string;
  volume: number;
}

interface TransactionVolumeChartProps {
  data: ChartData[];
}

export function TransactionVolumeChart({ data }: TransactionVolumeChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="border-none ring-0 shadow-xl shadow-slate-300/60 rounded-xl">
        <CardHeader>
          <CardTitle>Transaction Volume</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[300px] w-full mt-4 flex items-center justify-center bg-slate-50/50 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none ring-0 shadow-xl shadow-slate-300/60 rounded-xl">
      <CardHeader>
        <CardTitle>Transaction Volume</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#0ea5e9"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="#0ea5e9"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                stroke="#718096"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                interval={data.length === 24 ? 2 : data.length === 12 ? 2 : data.length === 30 ? 4 : 0}
              />
              <YAxis
                stroke="#718096"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFF',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                }}
                itemStyle={{ color: '#2D3748' }}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#0ea5e9"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorVolume)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
