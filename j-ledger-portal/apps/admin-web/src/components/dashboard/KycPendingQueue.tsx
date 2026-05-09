'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { kycRequester } from '@/lib/requesters';
import { User, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export function KycPendingQueue() {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const data = (await kycRequester.getPendingList()) as any[];
        // Take latest 5
        setPendingUsers(data.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch pending KYC', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
  }, []);

  if (loading) {
    return (
      <Card className="border-none shadow-sm ring-1 ring-slate-100">
        <CardHeader>
          <CardTitle className="text-sm font-bold">KYC Pending Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-50 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden flex flex-col h-full">
      <CardHeader className="border-b border-slate-50 bg-white py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            KYC Pending Queue
          </CardTitle>
          <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-amber-100">
            {pendingUsers.length} waiting
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <ScrollArea className="h-[300px]">
          <div className="divide-y divide-slate-50">
            {pendingUsers.length > 0 ? (
              pendingUsers.map((item) => (
                <Link
                  key={item.userId}
                  href={`/kyc/${item.userId}`}
                  className="flex items-center gap-3 p-4 hover:bg-slate-50/50 transition-colors group"
                >
                  <Avatar className="h-9 w-9 border border-slate-100">
                    <AvatarFallback className="bg-indigo-50 text-indigo-600 text-xs font-bold">
                      {item.user?.email?.[0].toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {item.user?.email || item.user?.phoneNumber}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Submitted {formatDistanceToNow(new Date(item.createdAt))} ago
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </Link>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <User className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs font-medium">No pending requests</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <div className="p-3 bg-slate-50/50 border-t border-slate-50 mt-auto">
        <Link
          href="/kyc"
          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1"
        >
          View full list
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </Card>
  );
}
