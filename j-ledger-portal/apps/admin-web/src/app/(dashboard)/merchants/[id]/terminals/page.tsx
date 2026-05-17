'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { 
  ArrowLeft, 
  Smartphone, 
  Plus, 
  RefreshCcw,
  Store,
  ShieldCheck,
  ChevronRight,
  Key,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

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
  const [rotatedTerminal, setRotatedTerminal] = useState<any>(null);
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

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

  const handleRotateSecret = async (terminalId: string) => {
    if (!confirm('Are you sure you want to rotate the secret key? The old key will stop working immediately.')) return;
    
    setIsRotating(true);
    try {
      const response = await merchantRequester.rotateTerminalSecret(terminalId);
      setRotatedTerminal(response);
      setIsRotateModalOpen(true);
      toast.success('Secret key rotated successfully');
    } catch (error) {
      toast.error('Failed to rotate secret key');
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 md:px-0 text-foreground">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest gap-2">
          <Link href="/merchants" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Merchants
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/merchants/${partnerId}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Partner Profile
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">Terminal Infrastructure</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/merchants/${partnerId}`}>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl bg-card shadow-xs border border-border">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2 mt-1">
                {partner && (
                  <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-bold uppercase text-[10px] tracking-widest px-2 py-0.5 rounded-lg">
                    {partner.name}
                  </Badge>
                )}
                <p className="text-sm text-muted-foreground">
                  Configure nodes and hardware for payment processing and point redemptions.
                </p>
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={fetchData} 
            disabled={loading}
            className="h-10 rounded-xl border-border text-muted-foreground font-bold text-xs uppercase tracking-wider bg-card"
          >
            <RefreshCcw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Network
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xs relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Smartphone className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="text-3xl font-black tracking-tight leading-none text-white">
              {merchants.reduce((acc, m) => acc + (m.terminals?.length || 0), 0)}
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-70 text-white/80">Total Active Nodes</div>
          </div>
        </div>

        <div className="md:col-span-2 bg-card text-card-foreground rounded-[2rem] p-6 border border-border shadow-xs flex items-center gap-6">
          <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-foreground uppercase tracking-tight">Security Protocol</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
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
          onRotateSecret={handleRotateSecret}
          isRotating={isRotating}
          isSME={partner?.type === 'SME'}
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

      {/* Rotate Secret Result Modal */}
      <Dialog open={isRotateModalOpen} onOpenChange={setIsRotateModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-none shadow-2xl p-8 text-center bg-card text-card-foreground">
            {rotatedTerminal && (
                <div className="space-y-6">
                    <div className="w-20 h-20 bg-amber-500/10 rounded-[2rem] flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
                        <Key className="w-10 h-10" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-foreground tracking-tight">Secret Key Rotated</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                            New secret key for <span className="font-bold text-foreground">{rotatedTerminal.name}</span>.
                            Update your terminal configuration immediately.
                        </p>
                    </div>
                    <div className="w-full space-y-4">
                        <div className="p-6 bg-slate-950 dark:bg-black rounded-[2rem] text-left">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] block mb-3">New HMAC Secret Key</label>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 font-mono text-xs text-white bg-white/5 p-3 rounded-xl border border-white/10 break-all select-all">
                                    {rotatedTerminal.secretKey}
                                </div>
                                <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    onClick={() => {
                                        navigator.clipboard.writeText(rotatedTerminal.secretKey);
                                        toast.success('Copied to clipboard');
                                    }}
                                    className="h-10 w-10 text-white/50 hover:text-white hover:bg-white/10"
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                             </div>
                        </div>
                    </div>
                    <Button onClick={() => setIsRotateModalOpen(false)} className="w-full h-12 rounded-xl font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
                        Done, I've Updated the terminal
                    </Button>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Reuse Badge from previous page
function Badge({ children, className, variant = 'default' }: any) {
  const variants: any = {
    default: 'bg-muted text-muted-foreground border-border',
    outline: 'border border-border text-muted-foreground',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
