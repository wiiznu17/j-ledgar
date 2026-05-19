'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Percent, 
  Globe, 
  Clock,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Coins,
  Banknote,
  Sliders,
  Receipt,
  Languages,
  Shield,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { getSystemSettings, updateSystemSettings } from '@/app/actions/system';

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSystemSettings();
      setSettings(data);
    } catch (error) {
      toast.error('Failed to fetch system settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSystemSettings(settings);
      toast.success('System settings updated successfully');
    } catch (error) {
      toast.error('Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-64 flex-col gap-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          Connecting to Finance Service...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 md:px-0 text-foreground">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-[2rem] border border-border shadow-xs">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400">
            <Settings className="w-6 h-6 animate-[spin_8s_linear_infinite]" />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight text-foreground">System Core Settings</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure global merchant commissions, tax parameters, transfer fees, and system limits.
            </p>
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-2xl h-11 px-6 shadow-md transition-all duration-300 hover:shadow-indigo-500/10 hover:-translate-y-0.5"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Configuration
        </Button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Merchant & Tax Settings */}
        <Card className="border border-border shadow-xs overflow-hidden bg-card text-card-foreground rounded-[2rem] transition-all duration-300 hover:shadow-md">
          <CardHeader className="bg-muted/30 border-b border-border p-6">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
              Merchant & Tax Configuration
              <Receipt className="w-4 h-4 text-indigo-500" />
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Global rates applied to merchant payments and service commissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="merchantFeeRate" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Merchant MDR Rate</Label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-black text-muted-foreground select-none">%</span>
                  <Input 
                    id="merchantFeeRate" 
                    type="number" 
                    step="0.0001"
                    value={settings.merchantFeeRate} 
                    onChange={(e) => updateField('merchantFeeRate', parseFloat(e.target.value))}
                    className="pl-7 font-mono font-semibold border-border bg-muted/20 text-foreground rounded-xl focus-visible:ring-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">Current: {(settings.merchantFeeRate * 100).toFixed(2)}%</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vatRate" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">System VAT Rate</Label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-black text-muted-foreground select-none">%</span>
                  <Input 
                    id="vatRate" 
                    type="number" 
                    step="0.0001"
                    value={settings.vatRate} 
                    onChange={(e) => updateField('vatRate', parseFloat(e.target.value))}
                    className="pl-7 font-mono font-semibold border-border bg-muted/20 text-foreground rounded-xl focus-visible:ring-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">Current: {(settings.vatRate * 100).toFixed(2)}%</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minMerchantPayment" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Min Payment (฿)</Label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-black text-indigo-600 dark:text-indigo-400 select-none">฿</span>
                  <Input 
                    id="minMerchantPayment" 
                    type="number" 
                    value={settings.minMerchantPayment} 
                    onChange={(e) => updateField('minMerchantPayment', parseFloat(e.target.value))}
                    className="pl-7.5 font-mono font-bold text-indigo-600 dark:text-indigo-400 border-border bg-muted/20 rounded-xl focus-visible:ring-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">Minimum per txn</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Limits */}
        <Card className="border border-border shadow-xs overflow-hidden bg-card text-card-foreground rounded-[2rem] transition-all duration-300 hover:shadow-md">
          <CardHeader className="bg-muted/30 border-b border-border p-6">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
              Transaction Limits
              <Sliders className="w-4 h-4 text-rose-500" />
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Daily and per-transaction monetary caps enforced for system security.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dailyLimit" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Daily Total Limit</Label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-black text-muted-foreground select-none">฿</span>
                  <Input 
                    id="dailyLimit" 
                    type="number" 
                    value={settings.dailyTransactionLimit} 
                    onChange={(e) => updateField('dailyTransactionLimit', parseFloat(e.target.value))}
                    className="pl-7 font-mono font-bold border-border bg-muted/20 text-foreground rounded-xl focus-visible:ring-indigo-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="perTxLimit" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Per Transaction Limit</Label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-black text-muted-foreground select-none">฿</span>
                    <Input 
                      id="perTxLimit" 
                      type="number" 
                      value={settings.perTransactionLimit} 
                      onChange={(e) => updateField('perTransactionLimit', parseFloat(e.target.value))}
                      className="pl-7 font-mono font-bold border-border bg-muted/20 text-foreground rounded-xl focus-visible:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyLimit" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Monthly Total Limit</Label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-black text-muted-foreground select-none">฿</span>
                    <Input 
                      id="monthlyLimit" 
                      type="number" 
                      value={settings.monthlyTransactionLimit} 
                      onChange={(e) => updateField('monthlyTransactionLimit', parseFloat(e.target.value))}
                      className="pl-7 font-mono font-bold border-border bg-muted/20 text-foreground rounded-xl focus-visible:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Fees */}
        <Card className="border border-border shadow-xs overflow-hidden bg-card text-card-foreground rounded-[2rem] lg:col-span-2 transition-all duration-300 hover:shadow-md">
          <CardHeader className="bg-muted/30 border-b border-border p-6">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
              Standard Service Fees
              <Coins className="w-4 h-4 text-emerald-500" />
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Fixed and variable processing fees for P2P transfers, cash withdrawals, and utility bills.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Transfer Fees */}
              <div className="space-y-4 p-5 bg-muted/30 rounded-2xl border border-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-foreground text-sm mb-3">
                    <div className="p-1 bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    P2P Transfers
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Min Transfer (฿)</Label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs font-black text-indigo-600 dark:text-indigo-400 select-none">฿</span>
                        <Input 
                          type="number" 
                          value={settings.minP2pTransfer} 
                          onChange={(e) => updateField('minP2pTransfer', parseFloat(e.target.value))}
                          className="pl-7 bg-indigo-500/5 border-indigo-500/20 font-bold text-indigo-600 dark:text-indigo-400 rounded-xl focus-visible:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Fixed Fee (฿)</Label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs font-black text-muted-foreground select-none">฿</span>
                        <Input 
                          type="number" 
                          value={settings.transferFeeFixed} 
                          onChange={(e) => updateField('transferFeeFixed', parseFloat(e.target.value))}
                          className="pl-7 border-border bg-card text-foreground rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Percentage (%)</Label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs font-black text-muted-foreground select-none">%</span>
                        <Input 
                          type="number" 
                          step="0.0001"
                          value={settings.transferFeePercentage} 
                          onChange={(e) => updateField('transferFeePercentage', parseFloat(e.target.value))}
                          className="pl-7 border-border bg-card text-foreground rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Withdrawal Fees */}
              <div className="space-y-4 p-5 bg-muted/30 rounded-2xl border border-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-foreground text-sm mb-3">
                    <div className="p-1 bg-rose-500/10 rounded-lg text-rose-600 dark:text-rose-400">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                    Withdrawals
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Fixed Fee (฿)</Label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs font-black text-muted-foreground select-none">฿</span>
                        <Input 
                          type="number" 
                          value={settings.withdrawalFeeFixed} 
                          onChange={(e) => updateField('withdrawalFeeFixed', parseFloat(e.target.value))}
                          className="pl-7 border-border bg-card text-foreground rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Percentage (%)</Label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs font-black text-muted-foreground select-none">%</span>
                        <Input 
                          type="number" 
                          step="0.0001"
                          value={settings.withdrawalFeePercentage} 
                          onChange={(e) => updateField('withdrawalFeePercentage', parseFloat(e.target.value))}
                          className="pl-7 border-border bg-card text-foreground rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bill Payment Fees */}
              <div className="space-y-4 p-5 bg-muted/30 rounded-2xl border border-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-foreground text-sm mb-3">
                    <div className="p-1 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                      <Receipt className="w-4 h-4" />
                    </div>
                    Bill Payments
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Fixed Fee (฿)</Label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs font-black text-muted-foreground select-none">฿</span>
                        <Input 
                          type="number" 
                          value={settings.billPaymentFeeFixed} 
                          onChange={(e) => updateField('billPaymentFeeFixed', parseFloat(e.target.value))}
                          className="pl-7 border-border bg-card text-foreground rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Percentage (%)</Label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs font-black text-muted-foreground select-none">%</span>
                        <Input 
                          type="number" 
                          step="0.0001"
                          value={settings.billPaymentFeePercentage} 
                          onChange={(e) => updateField('billPaymentFeePercentage', parseFloat(e.target.value))}
                          className="pl-7 border-border bg-card text-foreground rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <Card className="border border-border shadow-xs overflow-hidden bg-card text-card-foreground rounded-[2rem] transition-all duration-300 hover:shadow-md">
          <CardHeader className="bg-muted/30 border-b border-border p-6">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
              Localization Settings
              <Globe className="w-4 h-4 text-indigo-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lang" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Default Language</Label>
                <div className="relative flex items-center">
                  <Languages className="w-4 h-4 absolute left-3 text-muted-foreground/60" />
                  <Input 
                    id="lang" 
                    value={settings.defaultLanguage} 
                    onChange={(e) => updateField('defaultLanguage', e.target.value)}
                    className="pl-9 border-border bg-muted/20 text-foreground rounded-xl focus-visible:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tz" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">System Timezone</Label>
                <div className="relative flex items-center">
                  <Clock className="w-4 h-4 absolute left-3 text-muted-foreground/60" />
                  <Input 
                    id="tz" 
                    value={settings.timezone} 
                    onChange={(e) => updateField('timezone', e.target.value)}
                    className="pl-9 border-border bg-muted/20 text-foreground rounded-xl focus-visible:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings Placeholder */}
        <Card className="border border-border shadow-xs overflow-hidden bg-card text-card-foreground opacity-60 rounded-[2rem] transition-all duration-300 hover:shadow-md bg-linear-to-b from-card to-muted/20">
          <CardHeader className="bg-muted/30 border-b border-border p-6">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
              Security & Access Policies
              <Lock className="w-4 h-4 text-slate-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
             <div className="flex items-center justify-between py-2 bg-muted/30 px-4 rounded-xl border border-border/50">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground">Enforce 2FA for Admins</span>
                  <p className="text-[10px] text-muted-foreground">Require Multi-Factor authentication for administrative logins.</p>
                </div>
                <div className="w-9 h-5 bg-muted rounded-full relative cursor-not-allowed">
                  <div className="w-4 h-4 bg-card rounded-full absolute left-0.5 top-0.5 shadow-xs transition-all"></div>
                </div>
             </div>
             <p className="text-[9px] text-muted-foreground italic font-medium flex items-center gap-1.5 pt-1">
               <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> 
               Advanced security policies are managed by the Compliance Module.
             </p>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
