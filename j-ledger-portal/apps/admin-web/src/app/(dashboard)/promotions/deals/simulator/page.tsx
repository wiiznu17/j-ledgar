'use client';

import React, { useState, useEffect } from 'react';
import { promotionsRequester } from '@/lib/requesters';
import { ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { SimulatorDeal, PosSlip } from '@/components/promotions/simulator/types';
import { PhoneEmulator } from '@/components/promotions/simulator/PhoneEmulator';
import { PosEmulator } from '@/components/promotions/simulator/PosEmulator';
import { ThermalSlip } from '@/components/promotions/simulator/ThermalSlip';

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
  // ==================== CUSTOMER APP STATES ====================
  const [customerPoints, setCustomerPoints] = useState(1250);
  const [deals, setDeals] = useState<SimulatorDeal[]>(mockCatalog);
  const [customerLoading, setCustomerLoading] = useState(false);

  // Active Customer Coupon Slip
  const [redemptionCode, setRedemptionCode] = useState<string | null>(null);
  const [redemptionDeal, setRedemptionDeal] = useState<SimulatorDeal | null>(null);
  const [redemptionStatus, setRedemptionStatus] = useState<'PENDING' | 'REDEEMED' | 'USED'>('PENDING');

  // ==================== HIGH-FIDELITY ANDROID POS STATES ====================
  const [posScreen, setPosScreen] = useState<'PROVISIONING' | 'DASHBOARD' | 'SCANNER' | 'DEALS' | 'PROCESSING' | 'SUCCESS' | 'FAILURE'>('PROVISIONING');
  const [activeScanMode, setActiveScanMode] = useState<'PAYMENT' | 'LOYALTY' | 'DEAL_VERIFY'>('PAYMENT');
  
  const [terminalId, setTerminalId] = useState('POS-T1790');
  const [hmacSecret, setHmacSecret] = useState('3f6d12078f14c891ebb532c38d0eb7ffbf41497fab74ac5745727b0f1312a28d');
  const [provisionError, setProvisionError] = useState('');

  const [amountText, setAmountText] = useState('0.00');
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [posErrorMessage, setPosErrorMessage] = useState('');
  const [posSuccessMessage, setPosSuccessMessage] = useState('');

  const [posScanningLaser, setPosScanningLaser] = useState(false);
  const [posSlip, setPosSlip] = useState<PosSlip | null>(null);

  // Fetch actual catalog deals from DB on mount
  useEffect(() => {
    const fetchDeals = async () => {
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
        console.warn('Could not fetch database deals. Using mock catalog.');
      }
    };
    fetchDeals();
  }, []);

  // Customer Loyalty App: Redeem Deal (Generate coupon code)
  const handleCustomerRedeem = async (deal: SimulatorDeal) => {
    if (customerPoints < deal.pointsRequired) {
      toast.error('Insufficient loyalty points.');
      return;
    }

    setCustomerLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Generate random alphanumeric 12-char redemption code matching real BFF flow
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'PW'; // P-Wallet prefix
    for (let i = 0; i < 10; i++) {
      code += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    setCustomerPoints((p) => p - deal.pointsRequired);
    setRedemptionCode(code);
    setRedemptionDeal(deal);
    setRedemptionStatus('REDEEMED');
    setManualCodeInput(code); // Pre-fill manual input on POS for easy test
    setCustomerLoading(false);

    toast.success(`Redeemed ${deal.title}! Alphanumeric E-Coupon code generated.`);
  };

  // Customer Mobile App: Revert Slip View to catalog browse
  const handleCustomerBrowseOther = () => {
    setRedemptionCode(null);
    setRedemptionDeal(null);
    setRedemptionStatus('PENDING');
  };

  // POS Scanner laser simulator
  const handleSimulateScan = async () => {
    setPosScanningLaser(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setPosScanningLaser(false);

    if (activeScanMode === 'DEAL_VERIFY') {
      if (!redemptionCode) {
        setPosErrorMessage('No active coupon found on the customer phone. Generate one first!');
        setPosScreen('FAILURE');
        return;
      }
      setPosScreen('DEALS');
      toast.success('Dynamic E-Coupon scanned successfully!');
    } else if (activeScanMode === 'PAYMENT') {
      if (parseFloat(amountText) <= 0) {
        setPosErrorMessage('Transaction amount must be greater than 0.');
        setPosScreen('FAILURE');
        return;
      }
      setPosScreen('PROCESSING');
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setPosSuccessMessage(`Sale checkout authorized.`);
      setPosSlip({
        mode: 'PAYMENT',
        amount: amountText,
        usedAt: new Date().toLocaleTimeString(),
        terminalId: terminalId,
      });
      setPosScreen('SUCCESS');
      toast.success('Sale transaction authorized via secure gateway!');
    } else if (activeScanMode === 'LOYALTY') {
      const pts = parseInt(pointsToRedeem);
      if (isNaN(pts) || pts <= 0) {
        setPosErrorMessage('Redeem points must be greater than 0.');
        setPosScreen('FAILURE');
        return;
      }
      setPosScreen('PROCESSING');
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setPosSuccessMessage(`${pts} Points redeemed successfully.`);
      setPosSlip({
        mode: 'LOYALTY',
        points: pointsToRedeem,
        usedAt: new Date().toLocaleTimeString(),
        terminalId: terminalId,
      });
      setPosScreen('SUCCESS');
      toast.success('Loyalty points successfully deducted!');
    }
  };

  // Verify and redeem deal voucher on POS
  const handleVerifyManualCode = async () => {
    const cleaned = manualCodeInput.trim().toUpperCase();
    if (!cleaned) {
      toast.error('Please enter or scan a coupon code.');
      return;
    }

    if (redemptionCode && cleaned === redemptionCode) {
      if (redemptionStatus === 'USED') {
        setPosErrorMessage('This E-Coupon has already been used and cleared.');
        setPosScreen('FAILURE');
        return;
      }
      setPosScreen('DEALS');
    } else {
      setPosScreen('PROCESSING');
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setPosErrorMessage('Invalid redemption code. Code not found or expired.');
      setPosScreen('FAILURE');
    }
  };

  // Confirm Coupon redemption from Deals preview screen
  const handleConfirmRedeemCoupon = async () => {
    setPosScreen('PROCESSING');
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Deduct stock, mark as used
    setRedemptionStatus('USED');
    setPosSuccessMessage('BFF verification OK! Coupon cleared & stock adjusted.');
    setPosSlip({
      code: redemptionCode || 'PW-ERROR',
      mode: 'DEAL_VERIFY',
      dealTitle: redemptionDeal?.title || 'Coupon Offer',
      brandName: redemptionDeal?.brandName || 'Merchant Partner',
      usedAt: new Date().toLocaleTimeString(),
      terminalId: terminalId,
    });
    setPosScreen('SUCCESS');
    toast.success('Coupon redeemed and receipt printed!');
  };

  // Clean and reset POS Slate
  const handleClearPOS = () => {
    setPosScreen('DASHBOARD');
    setPosSlip(null);
    setAmountText('0.00');
    setPointsToRedeem('');
    setManualCodeInput('');
  };

  // Deregister terminal
  const handleDeregister = () => {
    setPosScreen('PROVISIONING');
    setAmountText('0.00');
    setPointsToRedeem('');
    setPosSlip(null);
    toast.info('Terminal deregistered. Secure storage secrets wiped.');
  };

  return (
    <div className="space-y-6 pb-15 text-foreground animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest gap-2 font-sans">
          <span className="opacity-60">Loyalty & Promotions</span>
          <ChevronRight className="w-3 h-3 opacity-60" />
          <span className="text-foreground">POS & Customer App Simulator</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-foreground mt-1 font-sans">
          Deals & Real-Time Android POS Simulator
        </h1>
        <p className="text-xs text-muted-foreground font-sans">
          Simulate end-to-end customer loyalty app redemptions and real-time merchant POS Android terminal clearances.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ==================== LEFT: CUSTOMER PHONE EMULATOR ==================== */}
        <PhoneEmulator
          customerPoints={customerPoints}
          deals={deals}
          customerLoading={customerLoading}
          redemptionCode={redemptionCode}
          redemptionDeal={redemptionDeal}
          redemptionStatus={redemptionStatus}
          posScanningLaser={posScanningLaser}
          posScreen={posScreen}
          activeScanMode={activeScanMode}
          onRedeem={handleCustomerRedeem}
          onBrowseOther={handleCustomerBrowseOther}
        />

        {/* ==================== RIGHT: HIGH-FIDELITY ANDROID SMART POS EMULATOR ==================== */}
        <PosEmulator
          posScreen={posScreen}
          setPosScreen={setPosScreen}
          activeScanMode={activeScanMode}
          setActiveScanMode={setActiveScanMode}
          terminalId={terminalId}
          setTerminalId={setTerminalId}
          hmacSecret={hmacSecret}
          setHmacSecret={setHmacSecret}
          provisionError={provisionError}
          setProvisionError={setProvisionError}
          amountText={amountText}
          setAmountText={setAmountText}
          pointsToRedeem={pointsToRedeem}
          setPointsToRedeem={setPointsToRedeem}
          manualCodeInput={manualCodeInput}
          setManualCodeInput={setManualCodeInput}
          posErrorMessage={posErrorMessage}
          posSuccessMessage={posSuccessMessage}
          posScanningLaser={posScanningLaser}
          redemptionCode={redemptionCode}
          redemptionDeal={redemptionDeal}
          redemptionStatus={redemptionStatus}
          onSimulateScan={handleSimulateScan}
          onVerifyManualCode={handleVerifyManualCode}
          onConfirmRedeemCoupon={handleConfirmRedeemCoupon}
          onDeregister={handleDeregister}
          onClearPOS={handleClearPOS}
        />
      </div>

      {/* ==================== MOCK RECEIPT THERMAL PRINTER SLOT ==================== */}
      <ThermalSlip posSlip={posSlip} />
    </div>
  );
}
