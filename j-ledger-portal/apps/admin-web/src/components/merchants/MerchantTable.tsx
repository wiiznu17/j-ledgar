'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, ShieldCheck, ShieldAlert, Store } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

interface Partner {
  id: string;
  name: string;
  taxId: string;
  status: string;
  createdAt: string;
  _count?: {
    merchants: number;
  };
}

interface MerchantTableProps {
  partners: Partner[];
  loading: boolean;
}

export function MerchantTable({ partners, loading }: MerchantTableProps) {
  const router = useRouter();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1 w-fit border shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            ACTIVE
          </Badge>
        );
      case 'PENDING_REVIEW':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 flex items-center gap-1 w-fit border shadow-xs">
            PENDING REVIEW
          </Badge>
        );
      case 'SUSPENDED':
        return (
          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 flex items-center gap-1 w-fit border shadow-xs">
            <ShieldAlert className="w-3.5 h-3.5" />
            SUSPENDED
          </Badge>
        );
      case 'INACTIVE':
        return (
          <Badge className="bg-muted text-muted-foreground border-border flex items-center gap-1 w-fit border shadow-xs">
            INACTIVE
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader className="bg-muted/30">
        <TableRow className="hover:bg-transparent border-border">
          <TableHead className="text-muted-foreground font-bold py-4">
            Partner Name
          </TableHead>
          <TableHead className="text-muted-foreground font-bold py-4">
            Tax ID
          </TableHead>
          <TableHead className="text-muted-foreground font-bold py-4 text-center">
            Merchants
          </TableHead>
          <TableHead className="text-muted-foreground font-bold py-4">
            Status
          </TableHead>
          <TableHead className="text-muted-foreground font-bold py-4">
            Created At
          </TableHead>
          <TableHead className="text-right py-4"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {partners.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="h-40 text-center text-muted-foreground"
            >
              No partners found matching the filters.
            </TableCell>
          </TableRow>
        ) : (
          partners.map((partner) => (
            <TableRow
              key={partner.id}
              className="hover:bg-muted/30 border-border transition-colors cursor-pointer"
              onClick={() => router.push(`/support/merchants/${partner.id}`)}
            >
              <TableCell className="py-4">
                <div className="font-semibold text-foreground">
                  {partner.name}
                </div>
                <div className="text-xs text-muted-foreground font-mono mt-0.5">
                  {partner.id}
                </div>
              </TableCell>
              <TableCell className="py-4 font-medium text-muted-foreground">
                {partner.taxId}
              </TableCell>
              <TableCell className="py-4 text-center">
                <Badge
                  variant="outline"
                  className="text-muted-foreground bg-muted border-border"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Store className="w-3 h-3 mr-1" />
                  {partner._count?.merchants || 0}
                </Badge>
              </TableCell>
              <TableCell className="py-4">
                {getStatusBadge(partner.status)}
              </TableCell>
              <TableCell className="py-4 text-muted-foreground text-sm">
                {new Date(partner.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="py-4 text-right">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/support/merchants/${partner.id}/terminals`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Terminals
                    </Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
