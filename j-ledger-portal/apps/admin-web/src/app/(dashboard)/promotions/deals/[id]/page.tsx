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
        <span className="text-foreground">Reward Details</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
              <h2 className="text-3xl font-black tracking-tight text-foreground">
              {deal.title}
              </h2>
              <Badge className={deal.isActive ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-muted text-muted-foreground border border-border'}>
                  {deal.isActive ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
          </div>
          <p className="text-muted-foreground font-medium">
            Reward ID: <span className="font-mono text-xs uppercase">{deal.id}</span>
          </p>
        </div>
        <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 font-bold shadow-xs"
            onClick={() => router.push(`/promotions/deals/${id}/edit`)}
        >
            <Edit2 size={16} className="mr-2" /> Edit Deal
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-xs rounded-[2rem] overflow-hidden bg-card text-card-foreground">
            <div className="aspect-video relative overflow-hidden bg-muted">
                {deal.imageUrl ? (
                    <img src={deal.imageUrl} alt={deal.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                )}
            </div>
            <CardContent className="p-8 space-y-6">
                <div>
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">Description</h3>
                    <p className="text-foreground leading-relaxed font-medium">
                        {deal.description}
                    </p>
                </div>

                <div>
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">Terms & Conditions</h3>
                    <div className="bg-muted p-6 rounded-2xl border border-border text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {deal.termsCondition || 'No specific terms provided.'}
                    </div>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
            <Card className="border-none shadow-xs rounded-[2rem] bg-card text-card-foreground p-6">
                <CardHeader className="p-0 mb-6">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Inventory Status</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <Tag size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Points Required</p>
                                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{deal.pointsRequired.toLocaleString()} PTS</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <ShoppingBag size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Availability</p>
                                <p className="text-lg font-black text-foreground">
                                    {deal.remainingStock.toLocaleString()} / {deal.stock.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-bold text-muted-foreground uppercase">Redeemed</p>
                             <p className="text-lg font-black text-foreground">{ (deal.stock - deal.remainingStock).toLocaleString() }</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border space-y-4">
                        <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-muted-foreground">Brand</span>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md border border-border p-0.5 bg-muted overflow-hidden">
                                    {deal.brand?.logoUrl && <img src={deal.brand.logoUrl} className="w-full h-full object-contain" />}
                                </div>
                                <span className="text-foreground">{deal.brand?.name || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-muted-foreground">Category</span>
                            <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                {deal.category?.name || 'N/A'}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-muted-foreground">Priority</span>
                            <span className="text-foreground">Level {deal.priority}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-xs rounded-[2rem] bg-card text-card-foreground p-6">
                <CardHeader className="p-0 mb-6">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Active Period</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                    <div className="space-y-1">
                         <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <CalendarIcon size={10} /> Valid From
                         </p>
                         <p className="text-sm font-bold text-foreground">
                            {deal.startDate ? format(new Date(deal.startDate), 'PPP') : 'No start date'}
                         </p>
                    </div>
                    <div className="space-y-1">
                         <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <CalendarIcon size={10} /> Valid Until
                         </p>
                         <p className="text-sm font-bold text-foreground">
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
