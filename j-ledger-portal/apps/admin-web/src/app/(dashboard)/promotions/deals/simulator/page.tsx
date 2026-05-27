'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { promotionsRequester } from '@/lib/requesters';
import {
  Smartphone,
  Ticket,
  Percent,
  Coins,
  ChevronRight,
  Printer,
  Sparkles,
  QrCode,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ScanLine,
} from 'lucide-react';
import { toast } from 'sonner';

interface SimulatorDeal {
  id: string;
  title: string;
  brandName: string;
  pointsRequired: number;
  imageUrl: string;
}

const mockCatalog: SimulatorDeal[] = [
  {
    id: 'deal_starbucks_latte',
    title: 'Free Hot Cafe Latte (Size Tall)',
    brandName: 'Starbucks Coffee',
    pointsRequired: 150,
    imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'deal_burgerking_whopper',
    title: 'Buy 1 Get 1 Free Whopper Combo',
    brandName: 'Burger King',
    pointsRequired: 300,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'deal_cinema_ticket',
    title: '1x Premium Seat Cinema E-Ticket',
    brandName: 'Major Cineplex',
    pointsRequired: 220,
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=200',
  }
];

export default function DealsSimulatorPage() {
  // Customer Wallet State (Points)
  const [customerPoints, setCustomerPoints] = useState(1250);
  const [deals, setDeals] = useState<SimulatorDeal[]>(mockCatalog);
  const [loading, setLoading] = useState(false);

  // Redemption States
  const [redemptionCode, setRedemptionCode] = useState<string | null>(null);
  const [redemptionDeal, setRedemptionDeal] = useState<SimulatorDeal | null>(null);
  const [redemptionStatus, setRedemptionStatus] = useState<'PENDING' | 'REDEEMED' | 'USED'>('PENDING');

  // Scanner Simulator States
  const [typedCode, setTypedCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [posSlip, setPosSlip] = useState<{
    code: string;
    dealTitle: string;
    brandName: string;
    usedAt: string;
    merchantId: string;
  } | null>(null);

  // Load actual database deals if they exist
  useEffect(() => {
    const fetchDeals = async () => {
      setLoading(true);
      try {
        const res = await promotionsRequester.getDeals({ params: { page: 1, limit: 5 } });
        if (res?.data && res.data.length > 0) {
          const formatted = res.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            brandName: item.brand?.name || 'Partner Shop',
            pointsRequired: item.pointsRequired || 100,
            imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=200',
          }));
          setDeals(formatted);
        }
      } catch (e) {
        console.warn('Could not fetch deals catalog, falling back to mock catalog.');
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, []);

  // Handle customer redeeming a deal
  const handleRedeem = async (deal: SimulatorDeal) => {
    if (customerPoints < deal.pointsRequired) {
      toast.error('Insufficient loyalty points.');
      return;
    }

    setLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate random alphanumeric 12-char redemption code
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'JL';
    for (let i = 0; i < 10; i++) {
      code += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    setCustomerPoints((p) => p - deal.pointsRequired);
    setRedemptionCode(code);
    setRedemptionDeal(deal);
    setRedemptionStatus('REDEEMED');
    setTypedCode(code); // auto-fill typedCode for easy sandbox execution
    setLoading(false);

    toast.success(`Successfully redeemed ${deal.title}! Alphanumeric code generated.`);
  };

  // Simulate POS laser sweep
  const triggerLaserScan = async () => {
    if (!redemptionCode) {
      toast.error('Please redeem a deal coupon on the customer phone first.');
      return;
    }
    setScanning(true);
    // Simulate scan sound or duration
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setScanning(false);
    toast.info('Barcode/QR Code scanned successfully! Handshaking with Gateway BFF.');
    handleVerifyAndUseCode(redemptionCode);
  };

  // Verify and Use code at POS
  const handleVerifyAndUseCode = async (codeToSubmit: string) => {
    const codeClean = codeToSubmit.trim().toUpperCase();
    if (!codeClean) {
      toast.error('Please enter a redemption code.');
      return;
    }

    setVerifying(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (redemptionCode && codeClean === redemptionCode) {
      if (redemptionStatus === 'USED') {
        toast.error('Coupon has already been used.');
        setVerifying(false);
        return;
      }

      // Success
      setRedemptionStatus('USED');
      setPosSlip({
        code: codeClean,
        dealTitle: redemptionDeal?.title || 'Coupon Deal',
        brandName: redemptionDeal?.brandName || 'Merchant Partner',
        usedAt: new Date().toLocaleTimeString(),
        merchantId: 'MCH-98218-SME',
      });
      toast.success('BFF verification OK! Coupon cleared & stock adjusted.');
    } else {
      toast.error('Invalid redemption code. Gateway returned 404 Not Found.');
    }
    setVerifying(false);
  };

  return (
    <div className="space-y-6 pb-15 text-foreground animate-in fade-in duration-500">
      <div className="space-y-1">
        <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest gap-2">
          <span className="opacity-60">Loyalty & Promotions</span>
          <ChevronRight className="w-3 h-3 opacity-60" />
          <span className="text-foreground">POS Deals Simulator</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-foreground mt-1">Deals & POS Scanner Simulator</h1>
        <p className="text-xs text-muted-foreground">Trace end-to-end customer coupon redemptions and real-time merchant POS barcode/laser clearances.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ==================== LEFT: CUSTOMER PHONE EMULATOR ==================== */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Smartphone className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Customer Loyalty App</span>
          </div>

          <div className="relative mx-auto max-w-[340px] aspect-[9/19] w-full rounded-[3.2rem] border-8 border-slate-900 bg-slate-950 p-3 shadow-2xl overflow-hidden flex flex-col justify-between">
            {/* Phone Speaker & Camera Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-2xl z-20 flex items-center justify-center">
              <div className="w-12 h-1 bg-slate-800 rounded-full mb-1"></div>
            </div>

            {/* Mobile Content View */}
            <div className="flex-1 bg-slate-900 rounded-[2.4rem] overflow-y-auto px-4 pt-8 pb-4 text-pretty flex flex-col justify-between h-full select-none custom-scrollbar">
              {/* Header Profile */}
              <div className="space-y-4 flex-shrink-0">
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-black text-[10px] text-white">
                      PT
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-white">Potayyr Dev</span>
                      <span className="text-[8px] text-muted-foreground">Loyalty Tier: GOLD</span>
                    </div>
                  </div>
                  {/* Points display */}
                  <div className="px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] font-bold flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" />
                    <span>{customerPoints} PTS</span>
                  </div>
                </div>

                <div className="h-[1px] bg-slate-800"></div>
              </div>

              {/* Dynamic body: Coupons listing or active coupon slip */}
              <div className="flex-1 py-4 flex flex-col gap-3 justify-center min-h-[300px]">
                {redemptionStatus === 'PENDING' ? (
                  <>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">
                      Available Shop Coupons
                    </span>
                    <div className="space-y-3">
                      {deals.map((deal) => (
                        <div
                          key={deal.id}
                          className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50 flex items-center gap-3 hover:border-slate-600 transition-all"
                        >
                          <img
                            src={deal.imageUrl}
                            alt={deal.title}
                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tight">{deal.brandName}</span>
                            <span className="text-[10px] font-bold text-white truncate">{deal.title}</span>
                            <button
                              onClick={() => handleRedeem(deal)}
                              disabled={loading}
                              className="mt-1.5 self-start px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black tracking-tight active:scale-95 transition-all flex items-center gap-1"
                            >
                              <Coins className="w-2.5 h-2.5" /> {deal.pointsRequired} Points
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  /* Beautiful loyalty coupon QR card */
                  <div className="bg-white text-slate-900 p-5 rounded-3xl border border-slate-200 flex flex-col items-center justify-between text-center relative overflow-hidden animate-in zoom-in duration-300">
                    {/* Reversal indicator tag if used */}
                    {redemptionStatus === 'USED' && (
                      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-emerald-400 font-bold text-xs gap-2 z-10">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                        <span>COUPON USED</span>
                        <span className="text-[9px] text-muted-foreground font-mono">Deducted from POS</span>
                      </div>
                    )}

                    <div className="w-full space-y-1">
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                        {redemptionDeal?.brandName} E-COUPON
                      </span>
                      <h4 className="text-xs font-black tracking-tight text-slate-800 line-clamp-2">
                        {redemptionDeal?.title}
                      </h4>
                    </div>

                    {/* Barcode/QR Box */}
                    <div className="my-5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center gap-2 relative">
                      <QrCode className="w-24 h-24 text-slate-800" />
                      <span className="font-mono text-xs font-black tracking-widest text-slate-900">
                        {redemptionCode}
                      </span>

                      {/* Simulated laser scan line */}
                      {scanning && (
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-red-600 shadow-md shadow-red-600 animate-bounce"></div>
                      )}
                    </div>

                    <p className="text-[8px] text-slate-500 leading-normal">
                      Show this barcode screen to the shop cashier to scan at their POS terminal checkout.
                    </p>

                    <Button
                      onClick={() => {
                        setRedemptionCode(null);
                        setRedemptionDeal(null);
                        setRedemptionStatus('PENDING');
                      }}
                      className="mt-4 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[9px] font-bold"
                    >
                      Browse Other Deals
                    </Button>
                  </div>
                )}
              </div>

              {/* Bottom Home Indicator */}
              <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-2 flex-shrink-0"></div>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT: MERCHANT POS EMULATOR ==================== */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Printer className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">POS Terminal Hardware</span>
          </div>

          <div className="relative mx-auto max-w-[340px] bg-slate-800 border-4 border-slate-700 rounded-[2.5rem] shadow-2xl p-5 overflow-hidden flex flex-col gap-5 justify-between">
            {/* POS Screen */}
            <div className="bg-slate-950 border border-slate-700 p-4 rounded-2xl min-h-[160px] flex flex-col justify-between text-pretty">
              <div className="flex items-center justify-between text-[8px] font-bold text-slate-500 uppercase">
                <span>POS TERMINAL v2.8</span>
                <span className="text-emerald-500 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  ONLINE
                </span>
              </div>

              {verifying ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono animate-pulse">
                    VERIFYING COUPON...
                  </span>
                </div>
              ) : posSlip ? (
                <div className="py-2 text-center flex flex-col items-center justify-center gap-2 animate-in zoom-in duration-300">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                  <span className="text-[10px] text-emerald-400 font-bold font-mono uppercase tracking-wider">
                    COUPON APPROVED!
                  </span>
                  <span className="text-[8px] text-slate-400">
                    Redemption {posSlip.code} successfully processed.
                  </span>
                  <Button
                    onClick={() => setPosSlip(null)}
                    className="mt-2 py-1.5 px-3 bg-slate-800 text-white rounded-lg text-[8px] font-bold"
                  >
                    Clear Slate
                  </Button>
                </div>
              ) : (
                <div className="py-4 space-y-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Redemption Entry
                  </span>

                  <div className="flex gap-2">
                    <Input
                      value={typedCode}
                      onChange={(e) => setTypedCode(e.target.value)}
                      placeholder="ENTER 12-CHAR CODE"
                      className="h-9 rounded-xl border-slate-700 bg-slate-900 text-xs font-mono font-bold tracking-widest text-center text-white"
                    />
                    <Button
                      onClick={() => handleVerifyAndUseCode(typedCode)}
                      className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] rounded-xl h-9 active:scale-95 transition-all"
                    >
                      OK
                    </Button>
                  </div>
                </div>
              )}

              <div className="h-[1px] bg-slate-900 my-2"></div>

              {/* Simulated laser scan action */}
              <Button
                onClick={triggerLaserScan}
                disabled={scanning || verifying}
                className="w-full py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white text-[10px] tracking-tight shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <ScanLine className="w-4 h-4 animate-pulse" />
                {scanning ? 'LASER SWEEP RUNNING...' : 'SCAN CUSTOMER PHONE SCREEN'}
              </Button>
            </div>

            {/* Thermal Printer Slot Output */}
            {posSlip && (
              <div className="bg-white text-slate-900 p-4 rounded-xl border border-slate-300 font-mono text-[9px] space-y-2 leading-relaxed shadow-sm animate-in slide-in-from-top-6 duration-700">
                <div className="text-center border-b border-dashed border-slate-400 pb-2">
                  <h5 className="font-bold">*** J-LEDGER SLIP ***</h5>
                  <span>MERCHANT SETTLEMENT RECEIPT</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>COUPON CODE:</span>
                    <span className="font-bold">{posSlip.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DEAL:</span>
                    <span className="font-bold">{posSlip.dealTitle.substring(0, 16)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PARTNER:</span>
                    <span className="font-bold">{posSlip.brandName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TERMINAL ID:</span>
                    <span className="font-bold">{posSlip.merchantId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TIME SPENT:</span>
                    <span className="font-bold">{posSlip.usedAt}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-400 pt-2 text-center text-[8px] text-slate-500">
                  <span>IPC THERMAL PRINT OK</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
