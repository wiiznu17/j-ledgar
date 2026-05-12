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
import { Eye, ExternalLink, ShieldCheck, ShieldAlert, Store } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

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
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 flex items-center gap-1 w-fit">
            <ShieldCheck className="w-3 h-3" />
            ACTIVE
          </Badge>
        );
      case 'PENDING_REVIEW':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-100 flex items-center gap-1 w-fit">
            PENDING REVIEW
          </Badge>
        );
      case 'SUSPENDED':
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-100 flex items-center gap-1 w-fit">
            <ShieldAlert className="w-3 h-3" />
            SUSPENDED
          </Badge>
        );
      case 'INACTIVE':
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 flex items-center gap-1 w-fit">
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
      <TableHeader className="bg-slate-50/50">
        <TableRow className="hover:bg-transparent border-slate-100">
          <TableHead className="text-slate-500 font-bold py-4">Partner Name</TableHead>
          <TableHead className="text-slate-500 font-bold py-4">Tax ID</TableHead>
          <TableHead className="text-slate-500 font-bold py-4 text-center">Merchants</TableHead>
          <TableHead className="text-slate-500 font-bold py-4">Status</TableHead>
          <TableHead className="text-slate-500 font-bold py-4">Created At</TableHead>
          <TableHead className="text-right py-4"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {partners.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="h-40 text-center text-slate-400">
              No partners found matching the filters.
            </TableCell>
          </TableRow>
        ) : (
          partners.map((partner) => (
            <TableRow key={partner.id} className="hover:bg-slate-50/50 border-slate-100 transition-colors">
              <TableCell className="py-4">
                <div className="font-semibold text-slate-800">{partner.name}</div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">{partner.id}</div>
              </TableCell>
              <TableCell className="py-4 font-medium text-slate-600">{partner.taxId}</TableCell>
              <TableCell className="py-4 text-center">
                <Badge variant="outline" className="text-slate-500 bg-slate-50">
                  <Store className="w-3 h-3 mr-1" />
                  {partner._count?.merchants || 0}
                </Badge>
              </TableCell>
              <TableCell className="py-4">{getStatusBadge(partner.status)}</TableCell>
              <TableCell className="py-4 text-slate-500 text-sm">
                {new Date(partner.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="py-4 text-right">
                <div className="flex justify-end gap-2">
                  <Link href={`/merchants/${partner.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/merchants/${partner.id}/terminals`}>
                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-slate-500 hover:text-indigo-600">
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
