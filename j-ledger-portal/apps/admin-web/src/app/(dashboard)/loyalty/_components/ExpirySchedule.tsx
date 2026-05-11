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
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from 'recharts';

interface ExpiryItem {
  period: string;
  amount: number;
}

interface ExpiryScheduleProps {
  data: ExpiryItem[];
}

export function ExpirySchedule({ data }: ExpiryScheduleProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="border-none shadow-sm ring-1 ring-slate-100">
        <CardHeader>
          <CardTitle className="text-lg">Points Expiry Schedule</CardTitle>
          <CardDescription>
            Estimated points that will expire at the end of each month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center bg-slate-50/50 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e'];

  return (
    <Card className="border-none shadow-sm ring-1 ring-slate-100">
      <CardHeader>
        <CardTitle className="text-lg">Points Expiry Schedule</CardTitle>
        <CardDescription>
          Estimated points that will expire at the end of each month
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="period"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value.toLocaleString()}`}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{
                  backgroundColor: '#FFF',
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value: any) => [`${Number(value || 0).toLocaleString()} Points`, 'Expiring']}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={40}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
