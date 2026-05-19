'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Store,
  History,
  Search,
  RotateCcw,
  Plus,
  ClipboardCheck,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { merchantRequester } from '@/lib/requesters';
import { MerchantTable } from '@/components/merchants/MerchantTable';
import { TablePagination } from '@/components/common/TablePagination';
import {
  FilterSearchInput,
  FilterSelect,
  FilterActions,
} from '@/components/common/FilterElements';

export default function MerchantsPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Draft Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<string>('ALL');

  // Applied Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
  });

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const response = await merchantRequester.getPartners({
        page,
        limit: 10,
        search: filters.search || undefined,
        status: filters.status !== 'ALL' ? filters.status : undefined,
      });

      setPartners(response.data || []);
      setTotal(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error('[MERCHANTS_PAGE] Fetch error:', error);
      toast.error('Failed to fetch merchant partners');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1);
    setFilters({
      search: searchTerm,
      status: status,
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatus('ALL');
    setPage(1);
    setFilters({
      search: '',
      status: 'ALL',
    });
  };

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', taxId: '' });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return toast.error('Partner name is required');

    setIsCreating(true);
    try {
      await merchantRequester.createPartner({
        name: createForm.name,
        taxId: createForm.taxId || undefined,
      });
      toast.success('Partner created successfully');
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', taxId: '' });
      fetchPartners(); // Refresh list
    } catch (error) {
      toast.error('Failed to create partner');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4 pb-10 text-foreground">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-xl shadow-xs border border-border text-card-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-bold text-foreground">
              Merchant Ecosystem
            </span>
          </div>
          <span className="h-4 w-px bg-border hidden md:inline-block" />
          <div className="text-xs font-medium text-muted-foreground">
            Total Partners: <strong className="text-foreground">{total}</strong>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/support/merchants/create">
            <Button className="h-9 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs text-xs font-bold">
              <Plus className="w-4 h-4" />
              Create Partner
            </Button>
          </Link>
          <Link href="/support/merchants/applications">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 border-border text-xs font-bold"
            >
              <ClipboardList className="w-4 h-4" />
              Approval Queue
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-none shadow-xs overflow-hidden bg-card text-card-foreground">
        <div className="p-3 bg-card border-b border-border">
          <form
            onSubmit={handleFilter}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
          >
            <FilterSearchInput
              label="Search Partner"
              placeholder="name, tax id..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:col-span-2"
            />

            <FilterSelect
              label="Status"
              value={status}
              onValueChange={(val: string) => setStatus(val || 'ALL')}
              options={[
                { label: 'ALL STATUSES', value: 'ALL' },
                { label: 'PENDING REVIEW', value: 'PENDING_REVIEW' },
                { label: 'ACTIVE', value: 'ACTIVE' },
                { label: 'INACTIVE', value: 'INACTIVE' },
                { label: 'SUSPENDED', value: 'SUSPENDED' },
              ]}
            />

            <FilterActions
              searchLabel="Filter"
              isLoading={loading}
              onReset={handleClearFilters}
            />
          </form>
        </div>

        <CardContent className="p-0">
          <MerchantTable partners={partners} loading={loading} />

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
