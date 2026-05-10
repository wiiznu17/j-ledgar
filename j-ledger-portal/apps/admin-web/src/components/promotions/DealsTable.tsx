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
import { Edit2, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { promotionsRequester } from '@/lib/requesters';
import { toast } from 'sonner';
import { useState } from 'react';

interface DealsTableProps {
  deals: any[];
  onEdit: (deal: any) => void;
  onRefresh: () => void;
}

export function DealsTable({ deals, onEdit, onRefresh }: DealsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    setDeletingId(id);
    try {
      await promotionsRequester.deleteDeal(id);
      toast.success('Deal deleted successfully');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete deal');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden border-border bg-white text-[#2D3748]">
      <Table>
        <TableHeader className="bg-secondary/50">
          <TableRow>
            <TableHead>Deal Info</TableHead>
            <TableHead>Brand / Category</TableHead>
            <TableHead>Points Required</TableHead>
            <TableHead>Stock Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => (
            <TableRow
              key={deal.id}
              className="hover:bg-secondary/30 transition-colors"
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={deal.imageUrl}
                      alt={deal.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as any).src =
                          'https://placehold.co/100x100?text=No+Image';
                      }}
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{deal.title}</div>
                    <div className="text-[10px] text-muted-foreground line-clamp-1 max-w-[200px]">
                      {deal.description}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-600 border-blue-100 text-[10px]"
                  >
                    {deal.brand?.name || 'No Brand'}
                  </Badge>
                  <div className="text-[10px] text-muted-foreground ml-1">
                    {deal.category?.name || 'General'}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 font-bold text-pink-500">
                  {deal.pointsRequired.toLocaleString()}{' '}
                  <span className="text-[10px] text-muted-foreground">pts</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-xs font-medium">
                    {deal.remainingStock} / {deal.stock}
                  </div>
                  <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${deal.remainingStock < 50 ? 'bg-orange-400' : 'bg-green-400'}`}
                      style={{
                        width: `${(deal.remainingStock / deal.stock) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-[10px]">
                  P{deal.priority}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-blue-600"
                    onClick={() => onEdit(deal)}
                  >
                    <Edit2 size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-600"
                    disabled={deletingId === deal.id}
                    onClick={() => handleDelete(deal.id)}
                  >
                    {deletingId === deal.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {deals.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-24 text-center text-muted-foreground"
              >
                No deals found. Create your first promotional offer!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
