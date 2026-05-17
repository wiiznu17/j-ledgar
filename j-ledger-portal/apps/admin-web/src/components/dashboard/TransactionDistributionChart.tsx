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
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface DistributionData {
  name: string;
  value: number;
}

interface TransactionDistributionChartProps {
  data: DistributionData[];
}

const COLORS = [
  '#BF3FFF', // Magenta (Payment)
  '#00C49F', // Green (Topup)
  '#FFBB28', // Yellow (P2P)
  '#FF8042', // Orange (Other)
];

const TYPE_LABELS: Record<string, string> = {
  PAYMENT: 'Payment',
  TOPUP: 'Top-up',
  P2P_TRANSFER: 'P2P Transfer',
  OTHER: 'Other',
};

export function TransactionDistributionChart({
  data,
}: TransactionDistributionChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAllZero = data.every((item) => item.value === 0);
  
  const displayData = isAllZero 
    ? [{ name: 'EMPTY', value: 1, label: 'No Activity' }]
    : data.filter(item => item.value > 0).map(item => ({
        ...item,
        label: TYPE_LABELS[item.name] || item.name
      }));

  const legendData = data.map(item => ({
    name: TYPE_LABELS[item.name] || item.name,
    value: item.value,
    color: COLORS[Object.keys(TYPE_LABELS).indexOf(item.name)] || '#CBD5E1'
  }));

  if (!mounted) {
    return (
      <Card className="border-none ring-0 shadow-xl shadow-slate-300/60 rounded-xl">
        <CardHeader>
          <CardTitle>Transaction Distribution</CardTitle>
          <CardDescription>Activity share by operation type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center bg-slate-50/50 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none ring-0 shadow-xl shadow-slate-300/60 rounded-xl h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle>Transaction Distribution</CardTitle>
        <CardDescription>Activity share by operation type</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full flex flex-col items-center justify-center py-2">
          {/* Centered Pie Chart Container */}
          <div className="relative w-[180px] h-[180px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={isAllZero ? 0 : 4}
                  dataKey="value"
                  nameKey="label"
                  stroke="none"
                >
                  {isAllZero ? (
                    <Cell fill="#F1F5F9" />
                  ) : (
                    displayData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[Object.keys(TYPE_LABELS).indexOf(entry.name)] || COLORS[index % COLORS.length]}
                      />
                    ))
                  )}
                </Pie>
                {!isAllZero && (
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                  />
                )}
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center label displaying total transactions count */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total</span>
              <span className="text-2xl font-black text-slate-800 leading-none">
                {isAllZero ? 0 : data.reduce((sum, item) => sum + item.value, 0)}
              </span>
            </div>
          </div>
          
          {/* Centered 2-Column Legend Grid at the Bottom */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 w-full max-w-[320px] mt-6">
            {legendData.map((item, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between border-b border-slate-50 pb-1.5"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-semibold text-slate-500 truncate">{item.name}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-slate-700">{item.value}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">txs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
