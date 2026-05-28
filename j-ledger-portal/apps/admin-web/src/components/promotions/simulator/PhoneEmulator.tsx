'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Smartphone,
  Coins,
  QrCode,
  CheckCircle,
  ChevronLeft,
  Zap,
  Info,
  Gift,
  Ticket
} from 'lucide-react';
import { SimulatorDeal } from './types';

interface PhoneEmulatorProps {
  customerPoints: number;
  deals: SimulatorDeal[];
  customerLoading: boolean;
  redemptionCode: string | null;
  redemptionDeal: SimulatorDeal | null;
  redemptionStatus: 'PENDING' | 'REDEEMED' | 'USED';
  posScanningLaser: boolean;
  posScreen: string;
  activeScanMode: string;
  onRedeem: (deal: SimulatorDeal) => void;
  onBrowseOther: () => void;
}

const getMockCategory = (deal: SimulatorDeal) => {
  const titleLower = deal.title.toLowerCase();
  if (titleLower.includes('latte') || titleLower.includes('coffee') || titleLower.includes('whopper') || titleLower.includes('burger') || titleLower.includes('combo')) {
    return 'Food & Beverage';
  }
  if (titleLower.includes('ticket') || titleLower.includes('cinema') || titleLower.includes('movie')) {
    return 'Entertainment';
  }
  return 'Shopping';
};

export const PhoneEmulator: React.FC<PhoneEmulatorProps> = ({
  customerPoints,
  deals,
  customerLoading,
  redemptionCode,
  redemptionDeal,
  redemptionStatus,
  posScanningLaser,
  posScreen,
  activeScanMode,
  onRedeem,
  onBrowseOther,
}) => {
  const [selectedDeal, setSelectedDeal] = useState<SimulatorDeal | null>(null);

  // Helper to handle redemption from the detail view
  const handleRedeemClick = (deal: SimulatorDeal) => {
    onRedeem(deal);
    setSelectedDeal(null); // Clear selected state so it will show QR code screen
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-2">
        <Smartphone className="w-4 h-4 text-pink-500 animate-pulse" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-sans">
          Customer Loyalty Mobile App (P-Wallet)
        </span>
      </div>

      <div className="relative mx-auto max-w-[340px] aspect-[9/19] w-full rounded-[3.2rem] border-8 border-slate-900 bg-white p-3 shadow-2xl overflow-hidden flex flex-col justify-between">
        {/* Phone Speaker & Camera Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-20 flex items-center justify-center">
          <div className="w-12 h-1 bg-slate-700 rounded-full mb-1"></div>
        </div>

        {/* Mobile Content View - Light themed exactly like real wallet-app */}
        <div className="flex-1 bg-[#f8f9fe] rounded-[2.4rem] overflow-y-auto pt-8 pb-4 text-pretty flex flex-col justify-between h-full select-none custom-scrollbar">
          
          {/* ==================== SCREEN 1: BROWSE CATALOG ==================== */}
          {redemptionStatus === 'PENDING' && !selectedDeal && (
            <div className="flex-1 flex flex-col justify-between h-full animate-in fade-in duration-300 px-4">
              {/* Header Profile */}
              <div className="space-y-4 flex-shrink-0">
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-400 to-indigo-500 flex items-center justify-center font-black text-[10px] text-white">
                      PT
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-800 font-sans">Potayyr Dev</span>
                      <span className="text-[7px] text-muted-foreground font-extrabold uppercase tracking-wider font-sans">GOLD member</span>
                    </div>
                  </div>
                  
                  {/* Points Balance Card (Mini badge) */}
                  <div className="px-2.5 py-1 rounded-xl bg-pink-50 border border-pink-100 text-[#f48fb1] font-sans text-[10px] font-black flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" />
                    <span>{customerPoints.toLocaleString()} PTS</span>
                  </div>
                </div>
                
                <div className="h-[1px] bg-slate-100"></div>
              </div>

              <div className="flex-1 py-4 flex flex-col gap-4">
                {/* Points Balance Card (Main Panel) */}
                <div className="bg-gradient-to-br from-pink-400 to-pink-500 p-4 rounded-[1.5rem] text-white shadow-md shadow-pink-200/50 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-80 font-sans">My Total Balance</span>
                    <h3 className="text-xl font-black tracking-tight font-sans">
                      {customerPoints.toLocaleString()} <span className="text-xs font-bold">pts</span>
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-black text-[#f48fb1] uppercase tracking-widest font-sans ml-1">
                    Exclusive Rewards
                  </span>

                  {deals.length === 0 ? (
                    <div className="text-center py-10 text-xs text-muted-foreground font-bold">
                      No deals available
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {deals.map((deal) => (
                        <div
                          key={deal.id}
                          onClick={() => setSelectedDeal(deal)}
                          className="p-3 bg-white rounded-2xl border border-slate-100/80 shadow-xs flex items-center gap-3 hover:border-pink-200 transition-all active:scale-98 cursor-pointer animate-in fade-in duration-300"
                        >
                          <img
                            src={deal.imageUrl}
                            alt={deal.title}
                            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[7px] font-black text-pink-500 uppercase tracking-tight bg-pink-50 px-1.5 py-0.5 rounded-md">
                                {deal.brandName}
                              </span>
                              <span className="text-[7px] font-black text-slate-400 uppercase tracking-tight bg-slate-50 px-1.5 py-0.5 rounded-md">
                                {getMockCategory(deal)}
                              </span>
                            </div>
                            <span className="text-[10px] font-extrabold text-slate-800 truncate mt-1 block">
                              {deal.title}
                            </span>
                            <div className="mt-1 flex items-center gap-1 text-[#f48fb1]">
                              <Zap className="w-2.5 h-2.5 fill-[#f48fb1]" />
                              <span className="text-[10px] font-black">{deal.pointsRequired.toLocaleString()} PTS</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== SCREEN 2: DEAL DETAIL VIEW (1:1 with wallet-app/deal/[id].tsx) ==================== */}
          {redemptionStatus === 'PENDING' && selectedDeal && (
            <div className="flex-1 flex flex-col justify-between h-full bg-[#f8f9fe] animate-in slide-in-from-right duration-300 relative select-none">
              
              {/* Scrollable details */}
              <div className="flex-1 overflow-y-auto px-4 pb-20 custom-scrollbar">
                
                {/* Cover Banner Image */}
                <div className="relative w-full h-44 bg-white rounded-3xl overflow-hidden shadow-xs mt-1">
                  <img
                    src={selectedDeal.imageUrl}
                    className="w-full h-full object-cover"
                    alt={selectedDeal.title}
                  />
                  <div className="absolute inset-0 bg-black/10" />

                  {/* Back Floating Button */}
                  <button
                    onClick={() => setSelectedDeal(null)}
                    className="absolute top-3 left-3 w-8 h-8 bg-white/95 rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
                  >
                    <ChevronLeft size={16} className="text-slate-800" />
                  </button>

                  {/* HOT DEAL floating tag */}
                  <div className="absolute bottom-3 left-3 bg-[#f48fb1] px-2.5 py-1 rounded-lg shadow-sm">
                    <span className="text-white text-[7px] font-black uppercase tracking-widest font-sans">
                      HOT DEAL
                    </span>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="pt-4 space-y-4">
                  {/* Category & Brand Badges */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-black text-pink-500 uppercase tracking-widest bg-pink-50 px-2 py-0.5 rounded-md">
                      {selectedDeal.brandName}
                    </span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">
                      {getMockCategory(selectedDeal)}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-800 leading-snug tracking-tight">
                      {selectedDeal.title}
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 leading-normal">
                      Redeem this premium offer using your accumulated J-Ledger Loyalty Points. Available for immediate scanning at POS terminals.
                    </p>
                  </div>

                  {/* Required Points Panel */}
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center border border-pink-100">
                        <Zap size={14} className="text-[#f48fb1] fill-[#f48fb1]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Required Points</span>
                        <span className="text-[12px] font-black text-[#f48fb1]">
                          {selectedDeal.pointsRequired.toLocaleString()} <span className="text-[8px] font-bold">pts</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end text-right">
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider">My Balance</span>
                      <span className="text-[10px] font-black text-slate-700">
                        {customerPoints.toLocaleString()} <span className="text-[8px] font-bold">pts</span>
                      </span>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="space-y-1 px-1">
                    <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest block">Terms & Conditions</span>
                    <p className="text-[8px] font-bold text-slate-400 leading-relaxed">
                      1. Coupon code valid for 1-time checkout at active P-Wallet POS terminals.<br />
                      2. Cannot be refunded or exchanged for cash once points are deducted.<br />
                      3. E-Coupon expires in 15 minutes after generation.
                    </p>
                  </div>

                  {/* Info Warning Banner */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex gap-2">
                    <Info size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[8px] font-bold text-slate-500 leading-normal">
                      Once redeemed, points will be deducted instantly. Cashiers must verify this code on the POS emulator dashboard.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sticky bottom CTA panel */}
              <div className="absolute bottom-0 inset-x-0 p-3 bg-white/95 border-t border-slate-100/60 rounded-b-[2.4rem] z-10">
                <Button
                  onClick={() => handleRedeemClick(selectedDeal)}
                  disabled={customerPoints < selectedDeal.pointsRequired || customerLoading}
                  className={`w-full h-11 rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all text-white font-black text-[11px] shadow-lg cursor-pointer ${
                    customerPoints < selectedDeal.pointsRequired 
                      ? 'bg-slate-300 shadow-slate-100 cursor-not-allowed' 
                      : 'bg-[#f48fb1] hover:bg-[#f48fb1]/90 shadow-pink-200'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  {customerPoints < selectedDeal.pointsRequired ? 'INSUFFICIENT BALANCE' : 'REDEEM THIS DEAL'}
                </Button>
              </div>

            </div>
          )}

          {/* ==================== SCREEN 3: DYNAMIC E-COUPON QR CARD ==================== */}
          {redemptionStatus !== 'PENDING' && (
            <div className="flex-1 flex flex-col justify-between animate-in zoom-in duration-300 px-4 h-full">
              
              <div className="flex-1 py-3 flex flex-col justify-center min-h-[300px]">
                
                {/* Beautiful loyalty coupon QR card (Pink accent) */}
                <div className="bg-white text-slate-900 p-5 rounded-[2rem] border border-pink-100 shadow-xl shadow-pink-100/30 flex flex-col items-center justify-between text-center relative overflow-hidden h-[340px]">
                  
                  {/* Used indicator tag overlay */}
                  {redemptionStatus === 'USED' && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-emerald-400 font-black text-xs gap-2 z-10 animate-in fade-in duration-300 select-none">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                      </div>
                      <span className="font-sans text-[13px] tracking-wide font-black">COUPON USED</span>
                      <span className="text-[8px] text-slate-400 font-mono tracking-tight">Cleared from POS Gateway</span>
                    </div>
                  )}

                  <div className="w-full space-y-1">
                    <span className="text-[9px] font-black text-pink-500 uppercase tracking-widest bg-pink-50 px-2.5 py-0.5 rounded-lg inline-block">
                      {redemptionDeal?.brandName} E-COUPON
                    </span>
                    <h4 className="text-xs font-black tracking-tight text-slate-800 line-clamp-2 mt-1">
                      {redemptionDeal?.title}
                    </h4>
                  </div>

                  {/* Barcode/QR Box */}
                  <div className="my-3 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-2 relative shadow-inner">
                    <QrCode className="w-24 h-24 text-slate-850" />
                    <span className="font-mono text-xs font-black tracking-widest text-[#f48fb1] bg-pink-50/50 px-3 py-1 rounded-lg border border-pink-100/40">
                      {redemptionCode}
                    </span>

                    {/* Simulated laser scan line */}
                    {posScanningLaser && posScreen === 'SCANNER' && activeScanMode === 'DEAL_VERIFY' && (
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-rose-600 shadow-md shadow-rose-600 animate-bounce"></div>
                    )}
                  </div>

                  <p className="text-[8px] text-slate-400 leading-normal font-sans px-2">
                    Show this dynamic screen to the shop cashier to scan at their Android Smart POS terminal checkout.
                  </p>

                  <Button
                    onClick={onBrowseOther}
                    className="mt-2 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[9px] font-black tracking-wide cursor-pointer"
                  >
                    Browse Other Coupons
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Home Indicator */}
          <div className="w-24 h-1 bg-slate-300 rounded-full mx-auto mt-2 flex-shrink-0"></div>
        </div>
      </div>
    </div>
  );
};
