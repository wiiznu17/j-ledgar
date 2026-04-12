'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface ChartData {
  time: string;
  volume: number;
}

interface TransactionVolumeChartProps {
  data: ChartData[];
}

export function TransactionVolumeChart({ data }: TransactionVolumeChartProps) {
  return (
    <Card className="col-span-4 border-border shadow-sm">
      <CardHeader>
        <CardTitle>Transaction Volume</CardTitle>
        <CardDescription>Mock visualization of system load throughout the day</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-magenta)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-pink)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#718096" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#718096" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#FFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                itemStyle={{ color: '#2D3748' }}
              />
              <Area type="monotone" dataKey="volume" stroke="var(--color-magenta)" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
