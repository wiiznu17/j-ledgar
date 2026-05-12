'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  User, 
  Mail, 
  Phone 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Application {
  id: string;
  businessName: string;
  category: string;
  contactName: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
}

interface MerchantApplicationTableProps {
  applications: Application[];
  loading: boolean;
  onReview: (id: string, status: 'APPROVED' | 'REJECTED') => void;
}

export function MerchantApplicationTable({ applications, loading, onReview }: MerchantApplicationTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-100 flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" />
            PENDING
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 flex items-center gap-1 w-fit">
            <CheckCircle className="w-3 h-3" />
            APPROVED
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-100 flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3" />
            REJECTED
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="text-slate-500 font-bold py-4">Business Information</TableHead>
            <TableHead className="text-slate-500 font-bold py-4">Contact Person</TableHead>
            <TableHead className="text-slate-500 font-bold py-4">Status</TableHead>
            <TableHead className="text-slate-500 font-bold py-4">Submitted At</TableHead>
            <TableHead className="text-right py-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-40 text-center text-slate-400">
                No pending applications found.
              </TableCell>
            </TableRow>
          ) : (
            applications.map((app) => (
              <TableRow key={app.id} className="hover:bg-slate-50/50 border-slate-100 transition-colors">
                <TableCell className="py-4">
                  <div className="font-semibold text-slate-800">{app.businessName}</div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <Badge variant="outline" className="text-[10px] px-1.5 h-4 border-slate-200">
                      {app.category}
                    </Badge>
                    <span className="font-mono">{app.id.substring(0, 8)}...</span>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {app.contactName}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {app.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4">{getStatusBadge(app.status)}</TableCell>
                <TableCell className="py-4 text-slate-500 text-sm">
                  {new Date(app.createdAt).toLocaleDateString()}
                  <div className="text-[10px] text-slate-400">
                    {new Date(app.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </TableCell>
                <TableCell className="py-4 text-right">
                  {app.status === 'PENDING' ? (
                    <div className="flex justify-end gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                            onClick={() => onReview(app.id, 'REJECTED')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Reject Application</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 border-emerald-100 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600"
                            onClick={() => onReview(app.id, 'APPROVED')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Approve Application</TooltipContent>
                      </Tooltip>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-slate-400 italic" disabled>
                      Processed
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}
