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
      <Card className="border-none ring-0 shadow-xs rounded-xl bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-sm font-bold">KYC Pending Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none ring-0 shadow-xs rounded-xl overflow-hidden flex flex-col h-full bg-card text-card-foreground">
      <CardHeader className="border-b border-border bg-card py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            KYC Pending Queue
          </CardTitle>
          <Badge
            variant="secondary"
            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
          >
            {pendingUsers.length} waiting
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <ScrollArea className="h-[300px]">
          <div className="divide-y divide-border">
            {pendingUsers.length > 0 ? (
              pendingUsers.map((item) => (
                <Link
                  key={item.userId}
                  href={`/risk/kyc/${item.userId}`}
                  className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors group"
                >
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarFallback className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                      {item.user?.email?.[0].toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {item.user?.email || item.user?.phoneNumber}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Submitted {formatDistanceToNow(new Date(item.createdAt))}{' '}
                      ago
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </Link>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <User className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs font-medium">No pending requests</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <div className="p-3 bg-muted/20 border-t border-border mt-auto">
        <Link
          href="/risk/kyc"
          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center justify-center gap-1"
        >
          View full list
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </Card>
  );
}
