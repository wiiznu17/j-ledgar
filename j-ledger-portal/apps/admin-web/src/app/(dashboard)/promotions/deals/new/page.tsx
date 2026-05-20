'use client';

import { DealForm } from '@/components/promotions/DealForm';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewDealPage() {
  return (
    <div className="space-y-6 pb-10 text-foreground">
      {/* Breadcrumbs */}
      <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest gap-2">
        <Link
          href="/promotions/deals"
          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-bold"
        >
          Deals & Rewards
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">Create New</span>
      </div>

      <div className="bg-card rounded-[2rem] shadow-xs border border-border overflow-hidden">
        <DealForm isPage={true} />
      </div>
    </div>
  );
}
