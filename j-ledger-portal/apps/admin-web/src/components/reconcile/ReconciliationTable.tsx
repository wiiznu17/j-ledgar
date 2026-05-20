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
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case ReconciliationStatus.DISCREPANCY:
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 animate-pulse';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (!reports || reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-lg bg-muted/50">
        <p className="text-muted-foreground font-medium">
          No reconciliation reports found.
        </p>
        <p className="text-sm text-muted-foreground">
          Manual audits will appear here once triggered.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border overflow-hidden shadow-xs bg-card text-card-foreground">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border">
            <TableHead className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground py-4 px-6">
              Report Date
            </TableHead>
            <TableHead className="text-right font-bold text-[11px] uppercase tracking-widest text-muted-foreground py-4 px-6">
              System Assets
            </TableHead>
            <TableHead className="text-right font-bold text-[11px] uppercase tracking-widest text-muted-foreground py-4 px-6">
              User Liabilities
            </TableHead>
            <TableHead className="text-right font-bold text-[11px] uppercase tracking-widest text-muted-foreground py-4 px-6">
              Discrepancy
            </TableHead>
            <TableHead className="text-center font-bold text-[11px] uppercase tracking-widest text-muted-foreground py-4 px-6">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow
              key={report.id}
              className={`hover:bg-muted/30 transition-colors border-b border-border last:border-0 ${report.status === ReconciliationStatus.DISCREPANCY ? 'bg-rose-500/10' : ''}`}
            >
              <TableCell className="py-4 px-6">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">
                    {format(new Date(report.reportDate), 'dd MMM yyyy')}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Daily Audit
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right py-4 px-6 font-mono text-sm font-medium text-muted-foreground">
                {formatCurrency(report.totalSystemAssets)}
              </TableCell>
              <TableCell className="text-right py-4 px-6 font-mono text-sm font-medium text-muted-foreground">
                {formatCurrency(report.totalUserLiabilities)}
              </TableCell>
              <TableCell
                className={`text-right py-4 px-6 font-mono text-sm font-black ${report.discrepancy !== 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}
              >
                {report.discrepancy > 0 ? '+' : ''}
                {formatCurrency(report.discrepancy)}
              </TableCell>
              <TableCell className="text-center py-4 px-6">
                <Badge
                  variant="outline"
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-tight border shadow-xs ${getStatusStyle(report.status)}`}
                >
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
