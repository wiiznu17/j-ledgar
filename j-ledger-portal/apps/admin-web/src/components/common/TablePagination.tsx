import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  limit?: number;
  onLimitChange?: (limit: number) => void;
  isLoading?: boolean;
  itemName?: string; // e.g. "deals", "users"
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  limit,
  onLimitChange,
  isLoading = false,
  itemName = 'records',
}: TablePaginationProps) {
  if (totalPages === 0 && totalItems === 0) return null;

  return (
    <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <p className="text-xs text-slate-500 font-medium">
          Showing page <strong className="text-slate-800">{currentPage}</strong> of{' '}
          <strong className="text-slate-800">{totalPages}</strong>
          <span className="hidden sm:inline">
            {' '}
            ({totalItems} total {itemName})
          </span>
        </p>

        {onLimitChange && limit && (
          <div className="flex items-center gap-2 border-l border-slate-100 pl-4 ml-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Show:</span>
            <Select
              value={limit.toString()}
              onValueChange={(v) => v && onLimitChange(parseInt(v))}
            >
              <SelectTrigger className="h-7 w-[70px] text-[10px] font-bold bg-slate-50 border-slate-200 rounded-md">
                <SelectValue placeholder={limit.toString()} />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-xl">
                {[10, 20, 50, 100].map((l) => (
                  <SelectItem key={l} value={l.toString()} className="text-xs font-medium">
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="h-8 px-3 text-xs font-bold rounded-lg border-slate-200 text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Prev
        </Button>

        {/* Page Numbers */}
        <div className="hidden sm:flex items-center gap-1 mx-1">
          {(() => {
            const pages = [];
            const showEllipsis = totalPages > 7;
            
            if (!showEllipsis) {
              for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
              // Always show page 1
              pages.push(1);
              
              if (currentPage > 3) pages.push('ellipsis-start');
              
              // Show 1 page before and after current
              const start = Math.max(2, currentPage - 1);
              const end = Math.min(totalPages - 1, currentPage + 1);
              
              for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
              }
              
              if (currentPage < totalPages - 2) pages.push('ellipsis-end');
              
              // Always show last page
              if (!pages.includes(totalPages)) pages.push(totalPages);
            }

            return pages.map((p, idx) => {
              if (typeof p === 'string') {
                return <span key={p + idx} className="px-2 text-slate-300 font-bold text-[10px]">...</span>;
              }
              return (
                <Button
                  key={p}
                  variant={currentPage === p ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onPageChange(p)}
                  disabled={isLoading}
                  className={`h-8 w-8 p-0 text-xs font-bold rounded-lg transition-all ${
                    currentPage === p 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 hover:bg-indigo-700' 
                      : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  {p}
                </Button>
              );
            });
          })()}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className="h-8 px-3 text-xs font-bold rounded-lg border-slate-200 text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
