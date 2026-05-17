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
        <Link
          href={`/promotions/deals/${id}`}
          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-bold"
        >
          {deal?.title || 'Details'}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">Edit</span>
      </div>

      <div>
        <h2 className="text-3xl font-black tracking-tight text-foreground">
          Edit Deal
        </h2>
        <p className="text-muted-foreground font-medium">
          Update the promotion details for <span className="text-indigo-600 dark:text-indigo-400 font-bold">{deal?.title}</span>
        </p>
      </div>

      <div className="bg-card rounded-[2rem] shadow-xs border border-border overflow-hidden">
        <DealForm initialData={deal} isPage={true} />
      </div>
    </div>
  );
}
