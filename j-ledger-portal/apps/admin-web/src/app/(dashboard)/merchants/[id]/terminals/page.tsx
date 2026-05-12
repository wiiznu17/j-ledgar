'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { 
  ArrowLeft, 
  Smartphone, 
  Plus, 
  RefreshCcw,
  Store,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import { merchantRequester } from '@/lib/requesters';
import { TerminalTable } from '@/components/merchants/TerminalTable';
import { CreateTerminalModal } from '@/components/merchants/CreateTerminalModal';

export default function TerminalsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: partnerId } = use(params);
  
  const [partner, setPartner] = useState<any>(null);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<{ id: string; name: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [partnerData, merchantsData] = await Promise.all([
        merchantRequester.getPartnerDetail(partnerId),
        merchantRequester.getPartnerMerchants(partnerId),
      ]);
      setPartner(partnerData);
      setMerchants(merchantsData || []);
    } catch (error) {
      console.error('[TERMINALS_PAGE] Fetch error:', error);
      toast.error('Failed to load merchant terminals');
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    if (partnerId) fetchData();
  }, [partnerId, fetchData]);

  const handleOpenModal = (merchantId: string, merchantName: string) => {
    setSelectedMerchant({ id: merchantId, name: merchantName });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 md:px-0">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest gap-2">
          <Link href="/merchants" className="hover:text-indigo-600 transition-colors">
            Merchants
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/merchants/${partnerId}`} className="hover:text-indigo-600 transition-colors">
            Partner Profile
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900">Terminal Infrastructure</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/merchants/${partnerId}`}>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-slate-500 hover:text-indigo-600 rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                Managed Terminals
                {partner && (
                  <Badge variant="outline" className="ml-2 bg-indigo-50 text-indigo-600 border-indigo-100 font-bold uppercase text-[10px] tracking-widest px-2 py-0.5 rounded-lg">
                    {partner.name}
                  </Badge>
                )}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Configure nodes and hardware for payment processing and point redemptions.
              </p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={fetchData} 
            disabled={loading}
            className="h-10 rounded-xl border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider bg-white"
          >
            <RefreshCcw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Network
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Smartphone className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="text-3xl font-black tracking-tight leading-none">
              {merchants.reduce((acc, m) => acc + (m.terminals?.length || 0), 0)}
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-70">Total Active Nodes</div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-[2rem] p-6 ring-1 ring-slate-100 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Security Protocol</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every terminal uses a unique HMAC-SHA256 secret key. Ensure hardware IDs are mapped correctly to prevent unauthorized transaction attempts.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8 pt-4">
        <TerminalTable 
          merchants={merchants} 
          loading={loading} 
          onCreateTerminal={handleOpenModal}
        />
      </div>

      {selectedMerchant && (
        <CreateTerminalModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          merchantId={selectedMerchant.id}
          merchantName={selectedMerchant.name}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}

// Reuse Badge from previous page
function Badge({ children, className, variant = 'default' }: any) {
  const variants: any = {
    default: 'bg-slate-100 text-slate-800',
    outline: 'border border-slate-200 text-slate-600',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
