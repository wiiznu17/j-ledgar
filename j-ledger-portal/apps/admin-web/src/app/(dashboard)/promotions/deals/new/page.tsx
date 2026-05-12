'use client';

import { DealForm } from '@/components/promotions/DealForm';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewDealPage() {
  return (
    <div className="space-y-6 pb-10">
      {/* Breadcrumbs */}
      <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest gap-2">
        <Link
          href="/promotions/deals"
          className="hover:text-blue-600 transition-colors font-bold"
        >
          Deals & Rewards
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-900">Create New</span>
      </div>

      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">
          Create New Deal
        </h2>
        <p className="text-slate-500 font-medium">
          Publish a new reward or promotion to the consumer app.
        </p>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-100 ring-1 ring-slate-100 overflow-hidden">
        <DealForm isPage={true} />
      </div>
    </div>
  );
}
