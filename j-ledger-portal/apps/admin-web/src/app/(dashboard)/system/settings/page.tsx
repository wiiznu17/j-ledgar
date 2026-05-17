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
  ShieldAlert, 
  Globe, 
  Clock,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Lock
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
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg">
              <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              System Settings
            </h2>
          </div>
          <p className="text-muted-foreground">
            Configure global fees, transaction limits, and regional settings.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-sm rounded-xl px-6"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Merchant & Tax Settings */}
        <Card className="border border-border shadow-xs overflow-hidden bg-card text-card-foreground">
          <CardHeader className="bg-muted/30 border-b border-border">
            <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <Percent className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Merchant & Tax Configuration
            </CardTitle>
            <CardDescription className="text-muted-foreground">Global rates applied to merchant payments and service fees.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="merchantFeeRate" className="text-xs font-bold uppercase text-muted-foreground">Merchant MDR Rate</Label>
                <div className="relative">
                  <Input 
                    id="merchantFeeRate" 
                    type="number" 
                    step="0.0001"
                    value={settings.merchantFeeRate} 
                    onChange={(e) => updateField('merchantFeeRate', parseFloat(e.target.value))}
                    className="pl-9 font-mono border-border bg-card text-foreground"
                  />
                  <Percent className="w-4 h-4 absolute left-3 top-3 text-muted-foreground/60" />
                </div>
                <p className="text-[10px] text-muted-foreground">Current: {(settings.merchantFeeRate * 100).toFixed(2)}%</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatRate" className="text-xs font-bold uppercase text-muted-foreground">System VAT Rate</Label>
                <div className="relative">
                  <Input 
                    id="vatRate" 
                    type="number" 
                    step="0.0001"
                    value={settings.vatRate} 
                    onChange={(e) => updateField('vatRate', parseFloat(e.target.value))}
                    className="pl-9 font-mono border-border bg-card text-foreground"
                  />
                  <Percent className="w-4 h-4 absolute left-3 top-3 text-muted-foreground/60" />
                </div>
                <p className="text-[10px] text-muted-foreground">Current: {(settings.vatRate * 100).toFixed(2)}%</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minMerchantPayment" className="text-xs font-bold uppercase text-muted-foreground">Min Payment (฿)</Label>
                <div className="relative">
                  <Input 
                    id="minMerchantPayment" 
                    type="number" 
                    value={settings.minMerchantPayment} 
                    onChange={(e) => updateField('minMerchantPayment', parseFloat(e.target.value))}
                    className="pl-9 font-mono font-bold text-indigo-600 dark:text-indigo-400 border-border bg-card"
                  />
                  <DollarSign className="w-4 h-4 absolute left-3 top-3 text-muted-foreground/60" />
                </div>
                <p className="text-[10px] text-muted-foreground">Minimum per txn</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Limits */}
        <Card className="border border-border shadow-xs overflow-hidden bg-card text-card-foreground">
          <CardHeader className="bg-muted/30 border-b border-border">
            <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" /> Transaction Limits
            </CardTitle>
            <CardDescription className="text-muted-foreground">Daily and per-transaction caps for security.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dailyLimit" className="text-xs font-bold uppercase text-muted-foreground">Daily Total Limit</Label>
                <div className="relative">
                  <Input 
                    id="dailyLimit" 
                    type="number" 
                    value={settings.dailyTransactionLimit} 
                    onChange={(e) => updateField('dailyTransactionLimit', parseFloat(e.target.value))}
                    className="pl-9 font-mono font-bold border-border bg-card text-foreground"
                  />
                  <DollarSign className="w-4 h-4 absolute left-3 top-3 text-muted-foreground/60" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="perTxLimit" className="text-xs font-bold uppercase text-muted-foreground">Per Transaction Limit</Label>
                  <Input 
                    id="perTxLimit" 
                    type="number" 
                    value={settings.perTransactionLimit} 
                    onChange={(e) => updateField('perTransactionLimit', parseFloat(e.target.value))}
                    className="font-mono border-border bg-card text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyLimit" className="text-xs font-bold uppercase text-muted-foreground">Monthly Total Limit</Label>
                  <Input 
                    id="monthlyLimit" 
                    type="number" 
                    value={settings.monthlyTransactionLimit} 
                    onChange={(e) => updateField('monthlyTransactionLimit', parseFloat(e.target.value))}
                    className="font-mono border-border bg-card text-foreground"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Fees */}
        <Card className="border border-border shadow-xs overflow-hidden bg-card text-card-foreground lg:col-span-2">
          <CardHeader className="bg-muted/30 border-b border-border">
            <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Standard Service Fees
            </CardTitle>
            <CardDescription className="text-muted-foreground">Fees for P2P transfers, withdrawals, and bill payments.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Transfer Fees */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-2xl border border-border">
                <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                  <ArrowUpRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> P2P Transfers
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Min Transfer (฿)</Label>
                    <Input 
                      type="number" 
                      value={settings.minP2pTransfer} 
                      onChange={(e) => updateField('minP2pTransfer', parseFloat(e.target.value))}
                      className="bg-indigo-500/5 border-indigo-500/20 font-bold text-indigo-600 dark:text-indigo-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Fixed Fee (฿)</Label>
                    <Input 
                      type="number" 
                      value={settings.transferFeeFixed} 
                      onChange={(e) => updateField('transferFeeFixed', parseFloat(e.target.value))}
                      className="border-border bg-card text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Percentage (%)</Label>
                    <Input 
                      type="number" 
                      step="0.0001"
                      value={settings.transferFeePercentage} 
                      onChange={(e) => updateField('transferFeePercentage', parseFloat(e.target.value))}
                      className="border-border bg-card text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Withdrawal Fees */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-2xl border border-border">
                <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                  <ArrowDownLeft className="w-4 h-4 text-rose-600 dark:text-rose-400" /> Withdrawals
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Fixed Fee (฿)</Label>
                    <Input 
                      type="number" 
                      value={settings.withdrawalFeeFixed} 
                      onChange={(e) => updateField('withdrawalFeeFixed', parseFloat(e.target.value))}
                      className="border-border bg-card text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Percentage (%)</Label>
                    <Input 
                      type="number" 
                      step="0.0001"
                      value={settings.withdrawalFeePercentage} 
                      onChange={(e) => updateField('withdrawalFeePercentage', parseFloat(e.target.value))}
                      className="border-border bg-card text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Bill Payment Fees */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-2xl border border-border">
                <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Bill Payments
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Fixed Fee (฿)</Label>
                    <Input 
                      type="number" 
                      value={settings.billPaymentFeeFixed} 
                      onChange={(e) => updateField('billPaymentFeeFixed', parseFloat(e.target.value))}
                      className="border-border bg-card text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Percentage (%)</Label>
                    <Input 
                      type="number" 
                      step="0.0001"
                      value={settings.billPaymentFeePercentage} 
                      onChange={(e) => updateField('billPaymentFeePercentage', parseFloat(e.target.value))}
                      className="border-border bg-card text-foreground"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <Card className="border border-border shadow-xs overflow-hidden bg-card text-card-foreground">
          <CardHeader className="bg-muted/30 border-b border-border">
            <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Localization
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lang" className="text-xs font-bold uppercase text-muted-foreground">Default Language</Label>
                <Input 
                  id="lang" 
                  value={settings.defaultLanguage} 
                  onChange={(e) => updateField('defaultLanguage', e.target.value)}
                  className="border-border bg-card text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tz" className="text-xs font-bold uppercase text-muted-foreground">System Timezone</Label>
                <div className="relative">
                  <Input 
                    id="tz" 
                    value={settings.timezone} 
                    onChange={(e) => updateField('timezone', e.target.value)}
                    className="pl-9 border-border bg-card text-foreground"
                  />
                  <Clock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground/60" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings Placeholder */}
        <Card className="border border-border shadow-xs overflow-hidden bg-card text-card-foreground opacity-60 grayscale-[0.5]">
          <CardHeader className="bg-muted/30 border-b border-border">
            <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Security Policies
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
             <div className="flex items-center justify-between py-2">
                <span className="text-sm font-semibold text-foreground">Enforce 2FA for Admins</span>
                <div className="w-10 h-5 bg-muted rounded-full relative">
                  <div className="w-4 h-4 bg-card rounded-full absolute left-0.5 top-0.5 shadow-xs"></div>
                </div>
             </div>
             <p className="text-[10px] text-muted-foreground mt-2 italic">* Advanced security policies are managed by the Compliance Module.</p>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
