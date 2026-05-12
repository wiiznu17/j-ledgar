'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ChevronRight, 
  Loader2, 
  Edit2, 
  Calendar as CalendarIcon, 
  Tag, 
  ShoppingBag, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  Users
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { promotionsRequester } from '@/lib/requesters';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import Link from 'next/link';

export default function DealDetailPage() {
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
        <span className="text-slate-900">Reward Details</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
              <h2 className="text-3xl font-black tracking-tight text-slate-900">
              {deal.title}
              </h2>
              <Badge className={deal.isActive ? 'bg-emerald-500' : 'bg-slate-400'}>
                  {deal.isActive ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
          </div>
          <p className="text-slate-500 font-medium">
            Reward ID: <span className="font-mono text-xs uppercase">{deal.id}</span>
          </p>
        </div>
        <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 font-bold shadow-lg shadow-blue-100"
            onClick={() => router.push(`/promotions/deals/${id}/edit`)}
        >
            <Edit2 size={16} className="mr-2" /> Edit Deal
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-[2.5rem] overflow-hidden bg-white">
            <div className="aspect-video relative overflow-hidden bg-slate-900">
                {deal.imageUrl ? (
                    <img src={deal.imageUrl} alt={deal.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">No Image</div>
                )}
            </div>
            <CardContent className="p-8 space-y-6">
                <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Description</h3>
                    <p className="text-slate-700 leading-relaxed font-medium">
                        {deal.description}
                    </p>
                </div>

                <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Terms & Conditions</h3>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                        {deal.termsCondition || 'No specific terms provided.'}
                    </div>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
            <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-[2rem] bg-white p-6">
                <CardHeader className="p-0 mb-6">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Inventory Status</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                                <Tag size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Points Required</p>
                                <p className="text-lg font-black text-blue-600">{deal.pointsRequired.toLocaleString()} PTS</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                                <ShoppingBag size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Availability</p>
                                <p className="text-lg font-black text-slate-800">
                                    {deal.remainingStock.toLocaleString()} / {deal.stock.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-bold text-slate-400 uppercase">Redeemed</p>
                             <p className="text-lg font-black text-slate-800">{ (deal.stock - deal.remainingStock).toLocaleString() }</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50 space-y-4">
                        <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-400">Brand</span>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md border p-0.5 bg-white overflow-hidden">
                                    {deal.brand?.logoUrl && <img src={deal.brand.logoUrl} className="w-full h-full object-contain" />}
                                </div>
                                <span className="text-slate-700">{deal.brand?.name || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-400">Category</span>
                            <Badge variant="secondary" className="bg-purple-50 text-purple-600 border-purple-100">
                                {deal.category?.name || 'N/A'}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-400">Priority</span>
                            <span className="text-slate-700">Level {deal.priority}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-[2rem] bg-white p-6">
                <CardHeader className="p-0 mb-6">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Active Period</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                    <div className="space-y-1">
                         <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                            <CalendarIcon size={10} /> Valid From
                         </p>
                         <p className="text-sm font-bold text-slate-700">
                            {deal.startDate ? format(new Date(deal.startDate), 'PPP') : 'No start date'}
                         </p>
                    </div>
                    <div className="space-y-1">
                         <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                            <CalendarIcon size={10} /> Valid Until
                         </p>
                         <p className="text-sm font-bold text-slate-700">
                            {deal.endDate ? format(new Date(deal.endDate), 'PPP') : 'Until stock lasts'}
                         </p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
