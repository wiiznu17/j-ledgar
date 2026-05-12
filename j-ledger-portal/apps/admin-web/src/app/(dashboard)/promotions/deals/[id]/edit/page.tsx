'use client';

import { useEffect, useState } from 'react';
import { DealForm } from '@/components/promotions/DealForm';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { promotionsRequester } from '@/lib/requesters';
import { toast } from 'sonner';
import Link from 'next/link';

export default function EditDealPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        const data = await promotionsRequester.getDeal(id);
        setDeal(data);
      } catch (error) {
        toast.error('Failed to load deal data');
        router.push('/promotions/deals');
      } finally {
        setLoading(false);
      }
    };
    fetchDeal();
  }, [id, router]);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 opacity-20" />
      </div>
    );
  }

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
        <Link
          href={`/promotions/deals/${id}`}
          className="hover:text-blue-600 transition-colors font-bold"
        >
          {deal?.title || 'Details'}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-900">Edit</span>
      </div>

      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">
          Edit Deal
        </h2>
        <p className="text-slate-500 font-medium">
          Update the promotion details for <span className="text-blue-600 font-bold">{deal?.title}</span>
        </p>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-100 ring-1 ring-slate-100 overflow-hidden">
        <DealForm initialData={deal} isPage={true} />
      </div>
    </div>
  );
}
