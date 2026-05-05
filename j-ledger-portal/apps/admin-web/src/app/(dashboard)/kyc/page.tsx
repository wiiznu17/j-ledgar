'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, User, Clock, CheckCircle2, XCircle, Eye, Search, Calendar as CalendarIcon, Filter, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

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
  } | null;
}

export default function KycListPage() {
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED'>('PENDING_APPROVAL');
  const [stats, setStats] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Values that will be used for the actual fetch
  const [activeFilters, setActiveFilters] = useState({
    status: 'PENDING_APPROVAL',
    phoneNumber: '',
    startDate: '',
    endDate: ''
  });

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: activeFilters.status,
        ...(activeFilters.phoneNumber && { phoneNumber: activeFilters.phoneNumber }),
        ...(activeFilters.startDate && { startDate: activeFilters.startDate }),
        ...(activeFilters.endDate && { endDate: activeFilters.endDate }),
      });
      const res = await apiClient.get<{ items: KycDocument[], stats: any }>(`/api/admin/kyc/list?${params.toString()}`);
      setDocuments(res.items);
      setStats(res.stats);
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
      endDate
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-indigo-500" />
            KYC Verification
          </h1>
          <p className="text-slate-500 text-sm">Review and manage user identity verifications</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden">
          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Total Pending</p>
              <h2 className="text-xl font-black text-slate-700">{stats?.pending || 0}</h2>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden">
          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Approved Today</p>
              <h2 className="text-xl font-black text-slate-700">{stats?.approvedToday || 0}</h2>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden">
          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Rejected Today</p>
              <h2 className="text-xl font-black text-slate-700">{stats?.rejectedToday || 0}</h2>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-none shadow-lg shadow-slate-200/50 overflow-hidden">
        <div className="p-5 bg-slate-50/50 border-b border-slate-100">
          <form onSubmit={handleApplyFilter} className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Verification Status
              </label>
              <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                <SelectTrigger className="w-[180px] bg-white border-slate-200 h-10 shadow-sm rounded-xl font-bold text-xs">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING_APPROVAL">PENDING</SelectItem>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="REJECTED">REJECTED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Phone Number
              </label>
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="08x-xxx-xxxx" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-9 h-10 text-xs border-slate-200 focus:ring-indigo-500 rounded-xl bg-white shadow-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Date From
              </label>
              <Popover>
                <PopoverTrigger 
                  render={
                    <Button variant="outline" className={`w-40 h-10 justify-start text-left font-medium text-xs bg-white border-slate-200 rounded-xl shadow-sm ${!startDate && "text-muted-foreground"}`}>
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                      {startDate ? format(new Date(startDate), "PPP") : "Pick date"}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate ? new Date(startDate) : undefined}
                    onSelect={(date: any) => setStartDate(date ? format(date, 'yyyy-MM-dd') : '')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Date To
              </label>
              <Popover>
                <PopoverTrigger 
                  render={
                    <Button variant="outline" className={`w-40 h-10 justify-start text-left font-medium text-xs bg-white border-slate-200 rounded-xl shadow-sm ${!endDate && "text-muted-foreground"}`}>
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                      {endDate ? format(new Date(endDate), "PPP") : "Pick date"}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate ? new Date(endDate) : undefined}
                    onSelect={(date: any) => setEndDate(date ? format(date, 'yyyy-MM-dd') : '')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2 ml-auto">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setPhoneNumber('');
                  setStartDate('');
                  setEndDate('');
                  setStatus('PENDING_APPROVAL');
                  setActiveFilters({
                    status: 'PENDING_APPROVAL',
                    phoneNumber: '',
                    startDate: '',
                    endDate: ''
                  });
                }}
                className="h-10 text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs font-bold px-4 rounded-xl border-slate-200"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button type="submit" size="sm" className="h-10 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold px-8 rounded-xl shadow-lg shadow-indigo-200">
                <Filter className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
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
                      <Badge variant="outline" className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] uppercase">
                        {doc.documentType}
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
                        <Button size="sm" variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
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
      </Card>
    </div>
  );
}
