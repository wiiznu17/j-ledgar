'use client';

import { ReconciliationReport, ReconciliationStatus } from '@repo/dto';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ReconciliationTableProps {
  reports: ReconciliationReport[];
}

export function ReconciliationTable({ reports }: ReconciliationTableProps) {
  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(amt);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case ReconciliationStatus.MATCHED:
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case ReconciliationStatus.DISCREPANCY:
        return 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  if (!reports || reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/50">
        <p className="text-muted-foreground font-medium">No reconciliation reports found.</p>
        <p className="text-sm text-muted-foreground">Manual audits will appear here once triggered.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
            <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-400 py-4 px-6">Report Date</TableHead>
            <TableHead className="text-right font-bold text-[11px] uppercase tracking-widest text-slate-400 py-4 px-6">System Assets</TableHead>
            <TableHead className="text-right font-bold text-[11px] uppercase tracking-widest text-slate-400 py-4 px-6">User Liabilities</TableHead>
            <TableHead className="text-right font-bold text-[11px] uppercase tracking-widest text-slate-400 py-4 px-6">Discrepancy</TableHead>
            <TableHead className="text-center font-bold text-[11px] uppercase tracking-widest text-slate-400 py-4 px-6">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow 
              key={report.id}
              className={`hover:bg-slate-50/30 transition-colors border-b border-slate-50 last:border-0 ${report.status === ReconciliationStatus.DISCREPANCY ? 'bg-rose-50/20' : ''}`}
            >
              <TableCell className="py-4 px-6">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">{format(new Date(report.reportDate), 'dd MMM yyyy')}</span>
                  <span className="text-[10px] text-slate-400 font-medium">Daily Audit</span>
                </div>
              </TableCell>
              <TableCell className="text-right py-4 px-6 font-mono text-sm font-medium text-slate-600">
                {formatCurrency(report.totalSystemAssets)}
              </TableCell>
              <TableCell className="text-right py-4 px-6 font-mono text-sm font-medium text-slate-600">
                {formatCurrency(report.totalUserLiabilities)}
              </TableCell>
              <TableCell className={`text-right py-4 px-6 font-mono text-sm font-black ${report.discrepancy !== 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {report.discrepancy > 0 ? '+' : ''}{formatCurrency(report.discrepancy)}
              </TableCell>
              <TableCell className="text-center py-4 px-6">
                <Badge variant="outline" className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-tight border shadow-sm ${getStatusStyle(report.status)}`}>
                  {report.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
