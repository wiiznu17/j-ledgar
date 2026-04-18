'use client';

import { ReconciliationReport } from '@/types/reconcile';
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
      minimumFractionDigits: 4,
    }).format(amt);
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
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[180px]">Report Date</TableHead>
            <TableHead className="text-right">System Assets</TableHead>
            <TableHead className="text-right">User Liabilities</TableHead>
            <TableHead className="text-right">Discrepancy</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow 
              key={report.id}
              className={report.status === 'DISCREPANCY' ? 'bg-destructive/5 hover:bg-destructive/10 transition-colors' : ''}
            >
              <TableCell className="font-medium">
                {format(new Date(report.reportDate), 'dd MMM yyyy')}
              </TableCell>
              <TableCell className="text-right text-foreground font-mono">
                {formatCurrency(report.totalSystemAssets)}
              </TableCell>
              <TableCell className="text-right text-foreground font-mono">
                {formatCurrency(report.totalUserLiabilities)}
              </TableCell>
              <TableCell className={`text-right font-mono font-bold ${report.discrepancy !== 0 ? 'text-destructive' : 'text-primary'}`}>
                {formatCurrency(report.discrepancy)}
              </TableCell>
              <TableCell className="text-center">
                {report.status === 'MATCHED' ? (
                  <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200/50">
                    MATCHED
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="font-bold border-2">
                    DISCREPANCY
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
