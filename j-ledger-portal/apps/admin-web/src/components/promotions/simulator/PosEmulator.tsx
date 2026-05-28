'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Printer,
  ChevronRight,
  CheckCircle,
  RefreshCw,
  ScanLine,
  XCircle
} from 'lucide-react';
import { SimulatorDeal } from './types';

interface PosEmulatorProps {
  posScreen: 'PROVISIONING' | 'DASHBOARD' | 'SCANNER' | 'DEALS' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  setPosScreen: (screen: 'PROVISIONING' | 'DASHBOARD' | 'SCANNER' | 'DEALS' | 'PROCESSING' | 'SUCCESS' | 'FAILURE') => void;
  activeScanMode: 'PAYMENT' | 'LOYALTY' | 'DEAL_VERIFY';
  setActiveScanMode: (mode: 'PAYMENT' | 'LOYALTY' | 'DEAL_VERIFY') => void;
  terminalId: string;
  setTerminalId: (id: string) => void;
  hmacSecret: string;
  setHmacSecret: (secret: string) => void;
  provisionError: string;
  setProvisionError: (err: string) => void;
  amountText: string;
  setAmountText: (text: string) => void;
  pointsToRedeem: string;
  setPointsToRedeem: (pts: string) => void;
  manualCodeInput: string;
  setManualCodeInput: (code: string) => void;
  posErrorMessage: string;
  posSuccessMessage: string;
  posScanningLaser: boolean;
  redemptionCode: string | null;
  redemptionDeal: SimulatorDeal | null;
  redemptionStatus: 'PENDING' | 'REDEEMED' | 'USED';
  onSimulateScan: () => Promise<void>;
  onVerifyManualCode: () => Promise<void>;
  onConfirmRedeemCoupon: () => Promise<void>;
  onDeregister: () => void;
  onClearPOS: () => void;
}

export const PosEmulator: React.FC<PosEmulatorProps> = ({
  posScreen,
  setPosScreen,
  activeScanMode,
  setActiveScanMode,
  terminalId,
  setTerminalId,
  hmacSecret,
  setHmacSecret,
  provisionError,
  setProvisionError,
  amountText,
  setAmountText,
  pointsToRedeem,
  setPointsToRedeem,
  manualCodeInput,
  setManualCodeInput,
  posErrorMessage,
  posSuccessMessage,
  posScanningLaser,
  redemptionCode,
  redemptionDeal,
  redemptionStatus,
  onSimulateScan,
  onVerifyManualCode,
  onConfirmRedeemCoupon,
  onDeregister,
  onClearPOS,
}) => {
  // Handle Numpad press internally and delegate states
  const handleNumpadPress = (key: string) => {
    if (activeScanMode === 'PAYMENT') {
      if (key === 'C') {
        setAmountText('0.00');
        return;
      }
      if (key === '⌫') {
        if (amountText.length <= 1 || amountText === '0.00') {
          setAmountText('0.00');
          return;
        }
        const clean = amountText.replace('.', '');
        const removed = clean.slice(0, -1);
        if (!removed) {
          setAmountText('0.00');
          return;
        }
        const parsed = parseFloat(removed) / 100.0;
        setAmountText(parsed.toFixed(2));
        return;
      }
      // Regular digits
      const clean = amountText.replace('.', '');
      if (clean.length >= 7) return;
      const added = clean + key;
      const parsed = parseFloat(added) / 100.0;
      setAmountText(parsed.toFixed(2));
    } else if (activeScanMode === 'LOYALTY') {
      if (key === 'C') {
        setPointsToRedeem('');
        return;
      }
      if (key === '⌫') {
        if (!pointsToRedeem) return;
        setPointsToRedeem(pointsToRedeem.slice(0, -1));
        return;
      }
      if (pointsToRedeem.length >= 6) return;
      setPointsToRedeem(pointsToRedeem + key);
    }
  };

  const handleProvisionSubmit = () => {
    if (!terminalId.trim() || !hmacSecret.trim()) {
      setProvisionError('Please fill in all security fields.');
      return;
    }
    if (hmacSecret.length < 16) {
      setProvisionError('HMAC secret must be a strong hex key (min 16 chars).');
      return;
    }
    setProvisionError('');
    setPosScreen('DASHBOARD');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-2">
        <Printer className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-sans">
          Merchant Android Smart POS Terminal
        </span>
      </div>

      <div className="relative mx-auto max-w-[340px] bg-slate-800 border-4 border-slate-700 rounded-[2.5rem] shadow-2xl p-5 overflow-hidden flex flex-col gap-4 justify-between">
        {/* POS Screen Container */}
        <div className="bg-[#0B0F19] border border-slate-700/60 p-4 rounded-2xl min-h-[380px] flex flex-col justify-between text-pretty relative overflow-hidden select-none">
          
          {/* ==================== POS SCREEN 1: PROVISIONING ==================== */}
          {posScreen === 'PROVISIONING' && (
            <div className="flex-1 flex flex-col justify-between py-2 text-slate-100 animate-in fade-in duration-300">
              <div className="space-y-2 text-center">
                <span className="text-[12px] font-black text-indigo-400 tracking-wider">
                  DEVICE PROVISIONING
                </span>
                <p className="text-[8px] text-slate-400 leading-normal">
                  Register this hardware terminal to establish Keystore secure layers and start HMAC synchronization.
                </p>
              </div>

              <div className="space-y-3 my-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">Terminal ID</label>
                  <Input
                    value={terminalId}
                    onChange={(e) => setTerminalId(e.target.value)}
                    placeholder="e.g. POS-T1790"
                    className="h-8 rounded-lg border-slate-700 bg-slate-900/50 text-[10px] text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">HMAC Secret Key</label>
                  <Input
                    value={hmacSecret}
                    onChange={(e) => setHmacSecret(e.target.value)}
                    placeholder="64-char hex key"
                    className="h-8 rounded-lg border-slate-700 bg-slate-900/50 text-[10px] font-mono text-white"
                  />
                </div>

                {provisionError && (
                  <span className="text-[8px] font-bold text-rose-500 block text-center">{provisionError}</span>
                )}
              </div>

              <Button
                onClick={handleProvisionSubmit}
                className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
              >
                Provision Terminal
              </Button>
            </div>
          )}

          {/* ==================== POS SCREEN 2: DASHBOARD ==================== */}
          {posScreen === 'DASHBOARD' && (
            <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-300">
              {/* --- POS Header --- */}
              <div className="flex items-center justify-between text-[9px] font-black text-slate-500 uppercase tracking-tight">
                <div className="flex flex-col">
                  <span className="text-indigo-400 font-extrabold text-[10px]">P-WALLET POS</span>
                  <span className="text-[8px] text-slate-500 font-bold">ID: {terminalId}</span>
                </div>
                <button
                  onClick={onDeregister}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-rose-500 rounded border border-rose-500/20 text-[7px] font-black tracking-tighter cursor-pointer"
                >
                  DEREGISTER
                </button>
              </div>

              {/* --- Scan Mode Tabs --- */}
              <div className="grid grid-cols-3 bg-[#1E293B] rounded-lg p-0.5 my-3 text-center border border-slate-700/30">
                <button
                  onClick={() => setActiveScanMode('PAYMENT')}
                  className={`py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    activeScanMode === 'PAYMENT' ? 'bg-[#334155] text-white' : 'text-slate-400'
                  }`}
                >
                  Charge
                </button>
                <button
                  onClick={() => setActiveScanMode('LOYALTY')}
                  className={`py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    activeScanMode === 'LOYALTY' ? 'bg-[#334155] text-white' : 'text-slate-400'
                  }`}
                >
                  Points
                </button>
                <button
                  onClick={() => setActiveScanMode('DEAL_VERIFY')}
                  className={`py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    activeScanMode === 'DEAL_VERIFY' ? 'bg-[#334155] text-white' : 'text-slate-400'
                  }`}
                >
                  Coupon
                </button>
              </div>

              {/* --- Dynamic Display --- */}
              <div className="flex-1 flex flex-col justify-center items-center py-2 text-center">
                {activeScanMode === 'PAYMENT' && (
                  <div className="space-y-1">
                    <span className="text-[8px] font-extrabold text-slate-500 tracking-wider">ENTER TRANSACTION AMOUNT</span>
                    <div className="flex items-baseline justify-center font-mono">
                      <span className="text-[20px] text-indigo-400 font-black mr-1">฿</span>
                      <span className="text-[32px] font-black text-white">{amountText}</span>
                    </div>
                  </div>
                )}

                {activeScanMode === 'LOYALTY' && (
                  <div className="space-y-1">
                    <span className="text-[8px] font-extrabold text-slate-500 tracking-wider">ENTER POINTS TO REDEEM</span>
                    <div className="flex items-baseline justify-center font-mono">
                      <span className="text-[32px] font-black text-white">{pointsToRedeem || '0'}</span>
                      <span className="text-[12px] font-bold text-emerald-400 ml-1">PTS</span>
                    </div>
                  </div>
                )}

                {activeScanMode === 'DEAL_VERIFY' && (
                  <div className="space-y-2 w-full px-2">
                    <span className="text-[8px] font-extrabold text-slate-400 tracking-wider block">SCAN PROMOTIONAL VOUCHER CODE</span>
                    <p className="text-[10px] text-slate-400 block font-semibold leading-normal">
                      Scan dynamic barcode or voucher code patterns
                    </p>
                    
                    <div className="flex gap-1.5 mt-2">
                      <Input
                        value={manualCodeInput}
                        onChange={(e) => setManualCodeInput(e.target.value)}
                        placeholder="ENTER 12-CHAR CODE"
                        className="h-8 rounded-lg border-slate-700 bg-slate-900 text-[10px] font-mono font-bold tracking-widest text-center text-white"
                      />
                      <Button
                        onClick={onVerifyManualCode}
                        className="px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] rounded-lg h-8 cursor-pointer"
                      >
                        OK
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* --- Compliance Indicators Box --- */}
              <div className="bg-[#1E293B] rounded-xl py-1.5 px-3 flex justify-between border border-slate-700/20 my-2 text-[7px] text-slate-400 font-bold">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> HMAC OK
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Replay Lock
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Gateway OK
                </span>
              </div>

              {/* --- Styled Numpad --- */}
              {activeScanMode !== 'DEAL_VERIFY' && (
                <div className="grid grid-cols-3 gap-1.5 my-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => (
                    <button
                      key={key}
                      onClick={() => handleNumpadPress(key)}
                      className="h-9 rounded-lg bg-[#334155] hover:bg-slate-600 text-white font-extrabold text-[12px] flex items-center justify-center transition-all cursor-pointer"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              )}

              {/* --- Trigger Scanner --- */}
              <Button
                onClick={() => setPosScreen('SCANNER')}
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-extrabold text-[11px] rounded-xl active:scale-95 transition-all mt-2 cursor-pointer"
              >
                Scan Customer QR / Barcode
              </Button>
            </div>
          )}

          {/* ==================== POS SCREEN 3: SCANNER ==================== */}
          {posScreen === 'SCANNER' && (
            <div className="flex-1 flex flex-col justify-between py-2 text-slate-100 animate-in fade-in duration-300">
              <div className="bg-black/60 py-1.5 px-3 rounded-lg border border-slate-700/30 text-center flex-shrink-0">
                <span className="text-[10px] text-yellow-400 font-bold tracking-wide">
                  MODE: SCANNING FOR {activeScanMode}
                </span>
              </div>

              {/* Mock Camera View */}
              <div className="my-6 aspect-[4/3] w-full rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="w-48 h-32 rounded-lg border-2 border-dashed border-slate-600/50 flex flex-col items-center justify-center text-center p-3 relative">
                  <ScanLine className="w-8 h-8 text-slate-500 opacity-60" />
                  <span className="text-[8px] text-slate-500 font-semibold mt-1">ALIGN CUSTOMER WALLET OR COUPON QR</span>
                  
                  {/* Bouncing laser line */}
                  {posScanningLaser ? (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-rose-600 shadow-md shadow-rose-600 animate-bounce"></div>
                  ) : (
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-rose-600 shadow-sm opacity-20"></div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={onSimulateScan}
                  disabled={posScanningLaser}
                  className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black tracking-tight active:scale-95 transition-all cursor-pointer"
                >
                  {posScanningLaser ? 'RUNNING LASER SWEEP...' : 'Simulate Scanning Success'}
                </Button>

                <Button
                  onClick={() => setPosScreen('DASHBOARD')}
                  className="w-full h-8 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9px] font-bold cursor-pointer"
                >
                  Cancel Scan
                </Button>
              </div>
            </div>
          )}

          {/* ==================== POS SCREEN 4: DEALS PREVIEW ==================== */}
          {posScreen === 'DEALS' && (
            <div className="flex-1 flex flex-col justify-between py-2 text-slate-100 animate-in fade-in duration-300">
              <span className="text-[10px] font-black text-center text-emerald-400 tracking-wider">
                PROMOTION VOUCHER VERIFIED
              </span>

              <div className="bg-[#1E293B] border border-slate-700/60 p-4 rounded-xl space-y-3 text-pretty my-4 flex-1 flex flex-col justify-center animate-in zoom-in duration-300">
                <div className="space-y-0.5">
                  <span className="text-[8px] font-black text-indigo-400 uppercase">
                    BRAND: {redemptionDeal?.brandName || 'Unknown Partner'}
                  </span>
                  <h4 className="text-[14px] font-black tracking-tight text-white leading-snug">
                    {redemptionDeal?.title}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-medium">
                    Terms & conditions apply. Valid for 1-time scan.
                  </p>
                </div>

                <div className="h-[1px] bg-slate-700/40 my-1"></div>

                <div className="space-y-0.5">
                  <span className="text-[8px] font-extrabold text-slate-500 uppercase">CUSTOMER MATCH</span>
                  <span className="text-[11px] font-bold text-white block">Potayyr Dev</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 flex-shrink-0">
                <Button
                  onClick={() => setPosScreen('DASHBOARD')}
                  className="h-10 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onConfirmRedeemCoupon}
                  className="h-10 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-extrabold text-[10px] rounded-lg cursor-pointer"
                >
                  Redeem
                </Button>
              </div>
            </div>
          )}

          {/* ==================== POS SCREEN 5: PROCESSING LOADER ==================== */}
          {posScreen === 'PROCESSING' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 animate-in fade-in duration-300">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest font-mono animate-pulse text-center">
                PROCESSING SECURE LEDGER...
              </span>
            </div>
          )}

          {/* ==================== POS SCREEN 6: SUCCESS FEEDBACK ==================== */}
          {posScreen === 'SUCCESS' && (
            <div className="flex-1 flex flex-col justify-between py-2 text-slate-100 animate-in fade-in duration-300">
              <div className="flex flex-col items-center text-center gap-1.5 py-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-[14px] font-black text-white mt-1">TRANSACTION APPROVED</span>
                <p className="text-[9px] text-slate-400 px-4 leading-normal">
                  {posSuccessMessage}
                </p>
              </div>

              <div className="bg-[#1E293B] border border-slate-700/60 p-3 rounded-lg my-2 flex-1 flex flex-col justify-center">
                <span className="text-[8px] font-black text-slate-500 tracking-wider uppercase block mb-1">RECEIPT SLIP LOG</span>
                <p className="text-[9px] text-slate-300 font-mono leading-relaxed">
                  A thermal receipt slip has been printed via IPC binding to the Mock Receipt Driver (AIDL sync complete). Paper cuts applied.
                </p>
              </div>

              <Button
                onClick={onClearPOS}
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg cursor-pointer"
              >
                Done, Charge Next
              </Button>
            </div>
          )}

          {/* ==================== POS SCREEN 7: FAILURE FEEDBACK ==================== */}
          {posScreen === 'FAILURE' && (
            <div className="flex-1 flex flex-col justify-between py-2 text-slate-100 animate-in fade-in duration-300">
              <div className="flex flex-col items-center text-center gap-1.5 py-4 flex-1 justify-center">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-rose-500" />
                </div>
                <span className="text-[14px] font-black text-white mt-1">TRANSACTION DECLINED</span>
                <p className="text-[9px] text-slate-400 px-4 leading-normal mt-1">
                  {posErrorMessage || 'Secure cryptographic validations failed.'}
                </p>
              </div>

              <Button
                onClick={() => setPosScreen('DASHBOARD')}
                className="w-full h-10 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg cursor-pointer"
              >
                Back to Dashboard
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
