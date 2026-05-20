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
import { Edit2, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { promotionsRequester } from '@/lib/requesters';
import { toast } from 'sonner';

interface BannersTableProps {
  banners: any[];
  onEdit: (banner: any) => void;
  onRefresh: () => void;
}

export function BannersTable({
  banners,
  onEdit,
  onRefresh,
}: BannersTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    setDeletingId(id);
    try {
      await promotionsRequester.deleteBanner(id);
      toast.success('Banner deleted successfully');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete banner');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden border-border bg-card text-card-foreground">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="text-foreground">Preview</TableHead>
            <TableHead className="text-foreground">Title</TableHead>
            <TableHead className="text-foreground">Action Path</TableHead>
            <TableHead className="text-foreground">Priority</TableHead>
            <TableHead className="text-right text-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {banners.map((banner) => (
            <TableRow
              key={banner.id}
              className="hover:bg-muted/30 border-b border-border transition-colors"
            >
              <TableCell>
                <div className="w-32 aspect-video rounded-lg overflow-hidden bg-muted border border-border">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as any).src =
                        'https://placehold.co/160x90?text=No+Image';
                    }}
                  />
                </div>
              </TableCell>
              <TableCell className="font-semibold text-foreground">
                {banner.title}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <ExternalLink size={12} />
                  {banner.actionPath}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className="bg-muted text-muted-foreground border-border"
                >
                  P{banner.priority}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400"
                    onClick={() => onEdit(banner)}
                  >
                    <Edit2 size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    disabled={deletingId === banner.id}
                    onClick={() => handleDelete(banner.id)}
                  >
                    {deletingId === banner.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {banners.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-24 text-center text-muted-foreground"
              >
                No active banners found. Add a promotional carousel to engage
                users!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
