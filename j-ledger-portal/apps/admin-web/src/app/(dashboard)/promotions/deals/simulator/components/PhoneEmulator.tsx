'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone, Coins, QrCode, CheckCircle } from 'lucide-react';
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
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-2">
        <Smartphone className="w-4 h-4 text-indigo-400 animate-pulse" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-sans">
          Customer Loyalty Mobile App
        </span>
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center font-black text-[10px] text-white">
                  PT
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white">Potayyr Dev</span>
                  <span className="text-[7px] text-muted-foreground font-semibold">Loyalty Member: GOLD</span>
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
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">
                  Shop Coupons Catalog
                </span>
                <div className="space-y-3">
                  {deals.map((deal) => (
                    <div
                      key={deal.id}
                      className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50 flex items-center gap-3 hover:border-slate-600 transition-all animate-in fade-in duration-300"
                    >
                      <img
                        src={deal.imageUrl}
                        alt={deal.title}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tight">
                          {deal.brandName}
                        </span>
                        <span className="text-[10px] font-bold text-white truncate">{deal.title}</span>
                        <button
                          onClick={() => onRedeem(deal)}
                          disabled={customerLoading}
                          className="mt-1.5 self-start px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black tracking-tight active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
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
                {/* Used indicator tag overlay */}
                {redemptionStatus === 'USED' && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-emerald-400 font-bold text-xs gap-2 z-10 animate-in fade-in duration-300">
                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                    <span>COUPON USED</span>
                    <span className="text-[9px] text-muted-foreground font-mono">Cleared from POS Gateway</span>
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
                  {posScanningLaser && posScreen === 'SCANNER' && activeScanMode === 'DEAL_VERIFY' && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-rose-600 shadow-md shadow-rose-600 animate-bounce"></div>
                  )}
                </div>

                <p className="text-[8px] text-slate-500 leading-normal">
                  Show this dynamic screen to the shop cashier to scan at their Android Smart POS terminal checkout.
                </p>

                <Button
                  onClick={onBrowseOther}
                  className="mt-4 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[9px] font-bold cursor-pointer"
                >
                  Browse Other Coupons
                </Button>
              </div>
            )}
          </div>

          {/* Bottom Home Indicator */}
          <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-2 flex-shrink-0"></div>
        </div>
      </div>
    </div>
  );
};
