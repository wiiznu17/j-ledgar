'use client';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { User, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface RedemptionsTableProps {
  redemptions: any[];
}

export function RedemptionsTable({ redemptions }: RedemptionsTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REDEEMED':
        return (
          <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            Ready
          </Badge>
        );
      case 'USED':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Used
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge className="bg-destructive/10 text-destructive border border-destructive/20">
            Expired
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-border text-muted-foreground"
          >
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden border-border bg-card text-card-foreground">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="text-foreground">User</TableHead>
            <TableHead className="text-foreground">Deal / Reward</TableHead>
            <TableHead className="text-foreground">Code</TableHead>
            <TableHead className="text-foreground">Status</TableHead>
            <TableHead className="text-foreground">Dates</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {redemptions.map((item) => (
            <TableRow
              key={item.id}
              className="hover:bg-muted/30 border-b border-border transition-colors"
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted items-center justify-center flex border border-border">
                    <User size={14} className="text-muted-foreground" />
                  </div>
                  <div className="text-xs font-medium font-mono truncate max-w-[100px] text-foreground">
                    {item.userId}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-semibold text-sm text-foreground">
                  {item.deal?.title}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {item.deal?.brand?.name}
                </div>
              </TableCell>
              <TableCell>
                <code className="bg-muted text-foreground px-2 py-1 rounded text-[10px] font-bold tracking-wider border border-border">
                  {item.redemptionCode}
                </code>
              </TableCell>
              <TableCell>{getStatusBadge(item.status)}</TableCell>
              <TableCell>
                <div className="space-y-1 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar size={10} /> Redeemed:{' '}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                  {item.status === 'USED' && (
                    <div className="flex items-center gap-1 text-emerald-500 font-medium">
                      <CheckCircle2 size={10} /> Used:{' '}
                      {new Date(item.usedAt).toLocaleDateString()}
                    </div>
                  )}
                  {item.status === 'REDEEMED' && (
                    <div className="flex items-center gap-1 text-orange-500">
                      <Clock size={10} /> Expires:{' '}
                      {new Date(item.expiresAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {redemptions.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-24 text-center text-muted-foreground"
              >
                No redemptions recorded yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
