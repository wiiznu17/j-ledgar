'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Ticket, Loader2 } from 'lucide-react';
import { promotionsRequester } from '@/lib/requesters';
import { DealsTable } from '@/components/promotions/DealsTable';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  FilterSearchInput,
  FilterSelect,
  FilterActions,
} from '@/components/common/FilterElements';
import { TablePagination } from '@/components/common/TablePagination';

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState('');
  const [brandId, setBrandId] = useState('all');
  const [categoryId, setCategoryId] = useState('all');
  const [status, setStatus] = useState('all');

  const [activeFilters, setActiveFilters] = useState({
    search: '',
    brandId: 'all',
    categoryId: 'all',
    status: 'all',
    page: 1,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchMeta = useCallback(async () => {
    try {
      const [bData, cData] = await Promise.all([
        promotionsRequester.getBrands(),
        promotionsRequester.getCategories(),
      ]);
      setBrands(bData);
      setCategories(cData);
    } catch (error) {
      console.error('Failed to load meta data');
    }
  }, []);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: activeFilters.page,
        limit: 10,
      };
      if (activeFilters.search) params.search = activeFilters.search;
      if (activeFilters.brandId !== 'all') params.brandId = activeFilters.brandId;
      if (activeFilters.categoryId !== 'all') params.categoryId = activeFilters.categoryId;
      if (activeFilters.status !== 'all') params.isActive = activeFilters.status === 'active';

      const res = await promotionsRequester.getDeals({ params });
      setDeals(res.data || []);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setTotalItems(res.pagination.total);
        setCurrentPage(res.pagination.page);
      }
    } catch (error) {
      toast.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  }, [activeFilters]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveFilters({
      search,
      brandId,
      categoryId,
      status,
      page: 1,
    });
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearch('');
    setBrandId('all');
    setCategoryId('all');
    setStatus('all');
    setActiveFilters({
      search: '',
      brandId: 'all',
      categoryId: 'all',
      status: 'all',
      page: 1,
    });
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    setActiveFilters((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground">
            Deals & Rewards
          </h2>
          <p className="text-muted-foreground font-medium text-sm">
            Manage points-based rewards and promotional offers for customers.
          </p>
        </div>
        <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs rounded-xl px-6 h-11 font-black transition-all active:scale-95"
            onClick={() => router.push('/promotions/deals/new')}
        >
          <Plus className="mr-2 h-5 w-5" /> New Deal
        </Button>
      </div>

      <Card className="border-none shadow-xs overflow-hidden bg-card text-card-foreground">
        {/* Filter Toolbar */}
        <div className="p-4 bg-card border-b border-border">
            <form onSubmit={handleApplyFilter} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <FilterSearchInput
                    label="Search Deals"
                    placeholder="Search by deal name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <FilterSelect
                    label="Brand"
                    value={brandId}
                    onValueChange={setBrandId}
                    options={[
                        { label: 'All Brands', value: 'all' },
                        ...brands.map(b => ({ label: b.name, value: b.id }))
                    ]}
                />

                <FilterSelect
                    label="Category"
                    value={categoryId}
                    onValueChange={setCategoryId}
                    options={[
                        { label: 'All Categories', value: 'all' },
                        ...categories.map(c => ({ label: c.name, value: c.id }))
                    ]}
                />

                <FilterSelect
                    label="Status"
                    value={status}
                    onValueChange={setStatus}
                    options={[
                        { label: 'All Status', value: 'all' },
                        { label: 'Active', value: 'active' },
                        { label: 'Inactive', value: 'inactive' },
                    ]}
                />

                <FilterActions
                    searchLabel="Filter"
                    isLoading={loading}
                    onReset={handleReset}
                />
            </form>
        </div>

        <CardHeader className="bg-muted/30 border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Ticket size={16} />
              </div>
              <CardTitle className="text-base font-bold text-foreground">Inventory List</CardTitle>
            </div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {totalItems} Total Deals
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Fetching Data...</span>
              </div>
            </div>
          ) : (
            <DealsTable
              deals={deals}
              onRefresh={fetchDeals}
            />
          )}
        </CardContent>

        <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            isLoading={loading}
            itemName="deals"
        />
      </Card>
    </div>
  );
}
