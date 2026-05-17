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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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

  // Rejection Dialog State
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');

  const handleReview = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    if (newStatus === 'REJECTED') {
      setSelectedAppId(id);
      setRejectionNote('');
      setIsRejectDialogOpen(true);
      return;
    }

    // Direct approval
    await processReview(id, 'APPROVED');
  };

  const processReview = async (id: string, status: 'APPROVED' | 'REJECTED', note?: string) => {
    const promise = merchantRequester.reviewApplication(id, { 
      status,
      note: note || `Reviewed via Admin Portal at ${new Date().toLocaleString()}`
    });

    toast.promise(promise, {
      loading: `Processing ${status.toLowerCase()}...`,
      success: () => {
        fetchApplications(); // Refresh list
        setIsRejectDialogOpen(false);
        return `Application ${status.toLowerCase()} successfully`;
      },
      error: 'Failed to process application review',
    });
  };

  const handleConfirmReject = () => {
    if (!selectedAppId) return;
    if (!rejectionNote.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    processReview(selectedAppId, 'REJECTED', rejectionNote);
  };

  return (
    <div className="space-y-4 pb-10 max-w-7xl mx-auto px-4 md:px-0 text-foreground">
      <div className="flex flex-col gap-3">
        {/* Breadcrumbs */}
        <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest gap-2">
          <Link href="/support/merchants" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Merchants
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">Application Queue</span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/support/merchants">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold px-2 py-0.5 rounded-lg">
                {total} Pending
              </Badge>
              <p className="text-sm text-muted-foreground">
                Review and approve new merchant partnership requests.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-4">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Fast-Track Policy</div>
            <div className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">Applications with complete tax documents are prioritized for review.</div>
          </div>
        </div>
        
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-4 md:col-span-2">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Verification Notice</div>
            <div className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">Ensure the business name matches the tax registration before approving. Approval grants access to create terminals and accept payments.</div>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-xs overflow-hidden bg-card text-card-foreground">
        <div className="p-3 bg-card border-b border-border">
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

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-5 h-5" />
              Reject Application
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Please provide a reason for rejecting this merchant application. This note will be visible to the applicant.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="e.g. Identity documents are blurry, please re-upload."
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              className="min-h-[100px] bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRejectDialogOpen(false)} className="text-muted-foreground">Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmReject}>Confirm Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add Badge import (helper)
function Badge({ children, className, variant = 'default' }: any) {
  const variants: any = {
    default: 'bg-muted text-muted-foreground border-border',
    outline: 'border border-border text-muted-foreground',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
