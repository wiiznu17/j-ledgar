'use client';

import React from 'react';
import { PosSlip } from './types';

interface ThermalSlipProps {
  posSlip: PosSlip | null;
}

export const ThermalSlip: React.FC<ThermalSlipProps> = ({ posSlip }) => {
  if (!posSlip) return null;

  return (
    <div className="max-w-[340px] mx-auto mt-6 bg-white text-slate-900 p-4 rounded-xl border border-slate-300 font-mono text-[9px] space-y-2.5 leading-relaxed shadow-lg animate-in slide-in-from-top-6 duration-700 select-none">
      <div className="text-center border-b border-dashed border-slate-400 pb-2">
        <h5 className="font-bold text-[10px]">*** P-WALLET RECEIPT ***</h5>
        <span>SMART TRANSACTION SLIP</span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span>MODE:</span>
          <span className="font-bold uppercase">{posSlip.mode}</span>
        </div>
        
        {posSlip.mode === 'DEAL_VERIFY' && (
          <>
            <div className="flex justify-between">
              <span>COUPON CODE:</span>
              <span className="font-bold">{posSlip.code}</span>
            </div>
            <div className="flex justify-between">
              <span>DEAL:</span>
              <span className="font-bold truncate max-w-[150px]">{posSlip.dealTitle}</span>
            </div>
            <div className="flex justify-between">
              <span>PARTNER:</span>
              <span className="font-bold">{posSlip.brandName}</span>
            </div>
          </>
        )}

        {posSlip.mode === 'PAYMENT' && (
          <div className="flex justify-between text-indigo-600 font-bold">
            <span>AMOUNT:</span>
            <span>฿ {posSlip.amount}</span>
          </div>
        )}

        {posSlip.mode === 'LOYALTY' && (
          <div className="flex justify-between text-emerald-600 font-bold">
            <span>POINTS REDEEMED:</span>
            <span>{posSlip.points} PTS</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>TERMINAL ID:</span>
          <span className="font-bold">{posSlip.terminalId}</span>
        </div>
        <div className="flex justify-between">
          <span>TIMESTAMP:</span>
          <span className="font-bold">{posSlip.usedAt}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-slate-400 pt-2 text-center text-[7px] text-slate-400">
        <span>IPC HARDWARE THERMAL PRINT SUCCESSFUL</span>
      </div>
    </div>
  );
};
