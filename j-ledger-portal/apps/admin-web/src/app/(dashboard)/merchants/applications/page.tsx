'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ClipboardCheck, 
  ArrowLeft, 
  Filter, 
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import { merchantRequester } from '@/lib/requesters';
import { MerchantApplicationTable } from '@/components/merchants/MerchantApplicationTable';
import { TablePagination } from '@/components/common/TablePagination';
import {
  FilterSelect,
  FilterActions,
} from '@/components/common/FilterElements';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [status, setStatus] = useState<string>('PENDING');
  const [appliedStatus, setAppliedStatus] = useState('PENDING');

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await merchantRequester.getApplications({
        page,
        limit: 10,
        status: appliedStatus === 'ALL' ? undefined : appliedStatus,
      });
      setApplications(response.data || []);
      setTotal(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error('[APPLICATIONS_PAGE] Fetch error:', error);
      toast.error('Failed to fetch merchant applications');
    } finally {
      setLoading(false);
    }
  }, [page, appliedStatus]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1);
    setAppliedStatus(status);
  };

  const handleClearFilters = () => {
    setStatus('PENDING');
    setAppliedStatus('PENDING');
    setPage(1);
  };

  const handleReview = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    const promise = merchantRequester.reviewApplication(id, { 
      status: newStatus,
      note: `Reviewed via Admin Portal at ${new Date().toLocaleString()}`
    });

    toast.promise(promise, {
      loading: `Processing ${newStatus.toLowerCase()}...`,
      success: () => {
        fetchApplications(); // Refresh list
        return `Application ${newStatus.toLowerCase()} successfully`;
      },
      error: 'Failed to process application review',
    });
  };

  return (
    <div className="space-y-4 pb-10 max-w-7xl mx-auto px-4 md:px-0">
      <div className="flex flex-col gap-3">
        {/* Breadcrumbs */}
        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest gap-2">
          <Link href="/merchants" className="hover:text-indigo-600 transition-colors">
            Merchants
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900">Application Queue</span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/merchants">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Application Queue
              <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-600 border-amber-100 font-bold">
                {total} Pending
              </Badge>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Review and approve new merchant partnership requests.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-start gap-4">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Fast-Track Policy</div>
            <div className="text-xs text-emerald-600/80 mt-1">Applications with complete tax documents are prioritized for review.</div>
          </div>
        </div>
        
        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-start gap-4 md:col-span-2">
          <div className="p-2 bg-amber-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Verification Notice</div>
            <div className="text-xs text-amber-600/80 mt-1">Ensure the business name matches the tax registration before approving. Approval grants access to create terminals and accept payments.</div>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
        <div className="p-3 bg-white border-b border-slate-100">
          <form
            onSubmit={handleFilter}
            className="flex flex-wrap items-end gap-4"
          >
            <div className="w-64">
              <FilterSelect
                label="Filter by Status"
                value={status}
                onValueChange={(val: string) => setStatus(val || 'ALL')}
                options={[
                  { label: 'PENDING REVIEW', value: 'PENDING' },
                  { label: 'APPROVED', value: 'APPROVED' },
                  { label: 'REJECTED', value: 'REJECTED' },
                  { label: 'ALL APPLICATIONS', value: 'ALL' },
                ]}
              />
            </div>

            <FilterActions
              searchLabel="Filter"
              isLoading={loading}
              onReset={handleClearFilters}
            />
          </form>
        </div>

        <CardContent className="p-0">
          <MerchantApplicationTable 
            applications={applications} 
            loading={loading} 
            onReview={handleReview}
          />

          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            onPageChange={(p) => setPage(p)}
            isLoading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Add Badge import (helper)
function Badge({ children, className, variant = 'default' }: any) {
  const variants: any = {
    default: 'bg-slate-100 text-slate-800',
    outline: 'border border-slate-200 text-slate-600',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
