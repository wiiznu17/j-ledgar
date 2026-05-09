'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Calendar as CalendarIcon,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { kycRequester } from '@/lib/requesters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import {
  FilterSearchInput,
  FilterSelect,
  FilterActions,
  FilterDatePicker,
} from '@/components/common/FilterElements';

interface KycDocument {
  id: string;
  userId: string;
  documentType: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  user: {
    id: string;
    email: string | null;
    phoneNumber: string | null;
    status: string;
  } | null;
}

export default function KycListPage() {
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED'>(
    'PENDING_APPROVAL',
  );
  const [stats, setStats] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Values that will be used for the actual fetch
  const [activeFilters, setActiveFilters] = useState({
    status: 'PENDING_APPROVAL',
    phoneNumber: '',
    startDate: '',
    endDate: '',
    page: 1,
  });

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await kycRequester.getList({
        status: activeFilters.status,
        phoneNumber: activeFilters.phoneNumber,
        startDate: activeFilters.startDate,
        endDate: activeFilters.endDate,
        page: activeFilters.page,
        limit: 10,
      });

      setDocuments(res.items);
      setStats(res.stats);
      if (res.meta) {
        setTotalPages(res.meta.totalPages);
        setTotalItems(res.meta.total);
        setCurrentPage(res.meta.page);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [activeFilters]);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveFilters({
      status,
      phoneNumber,
      startDate,
      endDate,
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
    <div className="space-y-4">
      {/* Compact Stats Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-bold text-slate-700">Today's Overview</span>
        </div>

        <div className="flex items-center flex-wrap gap-4 md:gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-500 font-medium">
              Pending: <strong className="text-slate-800">{stats?.pending || 0}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-500 font-medium">
              Approved Today:{' '}
              <strong className="text-slate-800">{stats?.approvedToday || 0}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-slate-500 font-medium">
              Rejected Today:{' '}
              <strong className="text-slate-800">{stats?.rejectedToday || 0}</strong>
            </span>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-3 bg-white border-b border-slate-100">
          <form
            onSubmit={handleApplyFilter}
            className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
          >
            <FilterSelect
              label="Account Status (Filter)"
              value={status}
              onValueChange={(val: any) => setStatus(val)}
              options={[
                { label: 'PENDING', value: 'PENDING_APPROVAL' },
                { label: 'ACTIVE', value: 'ACTIVE' },
                { label: 'REJECTED', value: 'REJECTED' },
              ]}
            />

            <FilterSearchInput
              label="Phone Number"
              placeholder="08x-xxx-xxxx"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />

            <FilterDatePicker label="Date From" value={startDate} onChange={setStartDate} />

            <FilterDatePicker label="Date To" value={endDate} onChange={setEndDate} />

            <FilterActions
              searchLabel="Search"
              isLoading={isLoading}
              onReset={() => {
                setPhoneNumber('');
                setStartDate('');
                setEndDate('');
                setStatus('PENDING_APPROVAL');
                setActiveFilters({
                  status: 'PENDING_APPROVAL',
                  phoneNumber: '',
                  startDate: '',
                  endDate: '',
                  page: 1,
                });
                setCurrentPage(1);
              }}
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">User Status</th>
                <th className="px-6 py-4">KYC Status</th>
                <th className="px-6 py-4">Date Submitted</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 h-20 bg-slate-50/20" />
                  </tr>
                ))
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-12 h-12 text-slate-200" />
                      <span>No records found for this status.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            {doc.user?.email || doc.user?.phoneNumber || 'Unknown User'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] uppercase"
                      >
                        {doc.documentType}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={`
                          font-bold text-[10px] uppercase border-none
                          ${
                            doc.user?.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : doc.user?.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                          }
                        `}
                      >
                        {doc.user?.status || 'UNKNOWN'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {doc.status === 'APPROVED' ? (
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                          <CheckCircle2 className="w-4 h-4" />
                          Approved
                        </div>
                      ) : doc.status === 'REJECTED' ? (
                        <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider">
                          <XCircle className="w-4 h-4" />
                          Rejected
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
                          <Clock className="w-4 h-4" />
                          Pending
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {format(new Date(doc.createdAt), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/kyc/${doc.userId}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination UI */}
        {totalPages > 0 && (
          <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Showing page <strong className="text-slate-800">{currentPage}</strong> of{' '}
              <strong className="text-slate-800">{totalPages}</strong>
              <span className="hidden sm:inline"> ({totalItems} total records)</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="h-8 px-3 text-xs font-bold rounded-lg border-slate-200 text-slate-600"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                className="h-8 px-3 text-xs font-bold rounded-lg border-slate-200 text-slate-600"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
