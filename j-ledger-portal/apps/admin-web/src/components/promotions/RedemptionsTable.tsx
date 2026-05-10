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
          <Badge className="bg-blue-50 text-blue-600 border-blue-100">
            Ready
          </Badge>
        );
      case 'USED':
        return (
          <Badge className="bg-green-50 text-green-600 border-green-100">
            Used
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge className="bg-red-50 text-red-600 border-red-100">
            Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden border-border bg-white text-[#2D3748]">
      <Table>
        <TableHeader className="bg-secondary/50">
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Deal / Reward</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Dates</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {redemptions.map((item) => (
            <TableRow
              key={item.id}
              className="hover:bg-secondary/30 transition-colors"
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center flex">
                    <User size={14} className="text-slate-400" />
                  </div>
                  <div className="text-xs font-medium font-mono truncate max-w-[100px]">
                    {item.userId}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-semibold text-sm">{item.deal?.title}</div>
                <div className="text-[10px] text-muted-foreground">
                  {item.deal?.brand?.name}
                </div>
              </TableCell>
              <TableCell>
                <code className="bg-slate-50 px-2 py-1 rounded text-[10px] font-bold tracking-wider border border-slate-100">
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
                    <div className="flex items-center gap-1 text-green-500 font-medium">
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
