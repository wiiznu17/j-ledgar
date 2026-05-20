'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TreasuryHealthChartProps {
  healthScore?: number;
  reserveRatio?: number;
  bankFloat?: number;
  settlementPending?: number;
  isLoading?: boolean;
}

export default function TreasuryHealthChart({
  healthScore = 88,
  reserveRatio = 124,
  bankFloat = 15430,
  settlementPending = 12,
  isLoading = false,
}: TreasuryHealthChartProps) {
  // Pie slices for the gauge: active progress and background track
  const data = [
    { name: 'Progress', value: healthScore },
    { name: 'Remaining', value: 100 - healthScore },
  ];

  // Colors: active Cyan-Green to soft gray
  const COLORS = ['#10B981', '#E2E8F0'];

  return (
    <Card className="border border-border/80 shadow-md shadow-slate-200/40 dark:shadow-none hover:shadow-lg hover:border-emerald-500/20 transition-all duration-300 rounded-xl h-full flex flex-col justify-between overflow-hidden bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            Treasury Health
          </CardTitle>
          <InfoTooltip
            content="คะแนนสุขภาพทางการเงินของระบบ คำนวณจากอัตราส่วนสำรอง (Reserve Ratio) และสถานะเงินรอโอน"
            iconClassName="text-muted-foreground hover:text-foreground"
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center flex-1 justify-center pb-6">
        {isLoading ? (
          <div className="h-[140px] w-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="relative w-full max-w-[200px] h-[110px] flex items-center justify-center mt-2">
            <ResponsiveContainer width="100%" height={150} minWidth={0}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="75%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={65}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                  paddingAngle={0}
                >
                  <Cell fill={COLORS[0]} />
                  <Cell fill={COLORS[1]} className="dark:fill-slate-800" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center Text inside gauge */}
            <div className="absolute top-[50%] flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-foreground tracking-tight">
                {healthScore}%
              </span>
              <span className="text-xs font-semibold text-emerald-500 tracking-wide mt-0.5">
                {healthScore >= 80
                  ? 'Healthy'
                  : healthScore >= 50
                    ? 'Warning'
                    : 'Critical'}
              </span>
            </div>
          </div>
        )}

        {/* Horizontal dividing grid */}
        <div className="grid grid-cols-3 gap-2 w-full border-t border-border/80 pt-5 mt-4 text-center">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Reserve Ratio
            </span>
            <span className="block text-sm font-bold text-foreground">
              {reserveRatio > 1000 ? 124 : reserveRatio}%
            </span>
            <span className="block text-[10px] font-medium text-emerald-500">
              Excellent
            </span>
          </div>

          <div className="space-y-1 border-x border-border/80 px-2">
            <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Bank Float
            </span>
            <span className="block text-sm font-bold text-foreground">
              ฿{bankFloat.toLocaleString('th-TH')}
            </span>
            <span className="block text-[10px] font-medium text-muted-foreground">
              Normal
            </span>
          </div>

          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Settlement
            </span>
            <span className="block text-sm font-bold text-foreground">
              {settlementPending}
            </span>
            <span
              className={`block text-[10px] font-bold ${settlementPending > 15 ? 'text-amber-500' : 'text-emerald-500'}`}
            >
              {settlementPending > 15 ? 'High' : 'Low'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
