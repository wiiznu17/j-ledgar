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
import { Edit2, Trash2, Loader2, Power, PowerOff, Calendar, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { promotionsRequester } from '@/lib/requesters';
import { toast } from 'sonner';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DealsTableProps {
  deals: any[];
  onRefresh: () => void;
}

export function DealsTable({ deals, onRefresh }: DealsTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      await promotionsRequester.toggleDeal(id);
      toast.success('Deal status updated');
      onRefresh();
    } catch (error) {
      toast.error('Failed to toggle deal status');
    } finally {
      setTogglingId(null);
    }
  };

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
    <div className="border rounded-lg overflow-hidden border-border bg-card text-card-foreground">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="text-foreground">Deal Info</TableHead>
            <TableHead className="text-foreground">Brand / Category</TableHead>
            <TableHead className="text-foreground">Points Required</TableHead>
            <TableHead className="text-foreground">Stock Status</TableHead>
            <TableHead className="text-foreground">Status</TableHead>
            <TableHead className="text-foreground">Priority</TableHead>
            <TableHead className="text-right text-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => (
            <TableRow
              key={deal.id}
              className="hover:bg-muted/30 border-b border-border transition-colors"
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-24 aspect-video rounded-lg overflow-hidden bg-muted border border-border shadow-xs">
                    <img
                      src={deal.imageUrl}
                      alt={deal.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as any).src =
                          'https://placehold.co/160x90?text=No+Image';
                      }}
                    />
                  </div>
                  <div>
                    <div 
                        className="font-bold text-sm text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                        onClick={() => router.push(`/promotions/deals/${deal.id}`)}
                    >
                        {deal.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground line-clamp-1 max-w-[200px]">
                      {deal.description}
                    </div>
                    {(deal.startDate || deal.endDate) && (
                      <div className="flex items-center gap-1 text-[9px] text-indigo-600 dark:text-indigo-400 mt-0.5 font-semibold">
                        <Calendar size={10} />
                        {deal.startDate
                          ? new Date(deal.startDate).toLocaleDateString()
                          : '...'}
                        {' - '}
                        {deal.endDate
                          ? new Date(deal.endDate).toLocaleDateString()
                          : '...'}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Badge
                    variant="outline"
                    className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px]"
                  >
                    {deal.brand?.name || 'No Brand'}
                  </Badge>
                  <div className="text-[10px] text-muted-foreground ml-1">
                    {deal.category?.name || 'General'}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400">
                  {deal.pointsRequired.toLocaleString()}{' '}
                  <span className="text-[10px] text-muted-foreground">pts</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-foreground">
                    {deal.remainingStock} / {deal.stock}
                  </div>
                  <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${deal.remainingStock < 50 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                      style={{
                        width: `${(deal.remainingStock / deal.stock) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 px-2 text-[10px] gap-1 ${deal.isActive ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : 'text-muted-foreground bg-muted border border-border'}`}
                  disabled={togglingId === deal.id}
                  onClick={() => handleToggle(deal.id)}
                >
                  {togglingId === deal.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : deal.isActive ? (
                    <>
                      <Power size={12} /> Active
                    </>
                  ) : (
                    <>
                      <PowerOff size={12} /> Inactive
                    </>
                  )}
                </Button>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground border-border">
                  P{deal.priority}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400"
                    onClick={() => router.push(`/promotions/deals/${deal.id}`)}
                    title="View Details"
                  >
                    <Eye size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400"
                    onClick={() => router.push(`/promotions/deals/${deal.id}/edit`)}
                    title="Edit Deal"
                  >
                    <Edit2 size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    disabled={deletingId === deal.id}
                    onClick={() => handleDelete(deal.id)}
                    title="Delete Deal"
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
                colSpan={7}
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
