'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  Wallet,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Building2,
  FileText,
  CreditCard,
  Gamepad2,
  ExternalLink,
  Plus,
  Settings,
  Loader2,
  User,
  Mail,
  Phone,
  Globe,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { merchantRequester } from '@/lib/requesters';

export default function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: partnerId } = use(params);
  const router = useRouter();

  const [partner, setPartner] = useState<any>(null);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isMerchantModalOpen, setIsMerchantModalOpen] = useState(false);
  const [newMerchantName, setNewMerchantName] = useState('');
  const [newMerchantAddress, setNewMerchantAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [p, m] = await Promise.all([
        merchantRequester.getPartnerDetail(partnerId),
        merchantRequester.getPartnerMerchants(partnerId)
      ]);
      setPartner(p);
      setMerchants(m || []);
    } catch (error) {
      console.error('Error fetching partner details', error);
      toast.error('Failed to load partner information');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (partnerId) fetchData();
  }, [partnerId]);

  const handleCreateMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await merchantRequester.createMerchant(partnerId, {
        name: newMerchantName,
        address: newMerchantAddress
      });
      toast.success('Merchant branch added successfully');
      setIsMerchantModalOpen(false);
      setNewMerchantName('');
      setNewMerchantAddress('');
      fetchData();
    } catch (error) {
      toast.error('Failed to add merchant branch');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-4 w-48 bg-muted rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-64 bg-muted/50 rounded-[2rem]" />
          <div className="h-64 bg-muted/50 rounded-[2rem]" />
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-10 bg-card rounded-3xl border border-dashed border-border text-card-foreground">
        <h2 className="text-2xl font-bold text-foreground">Partner Not Found</h2>
        <Button variant="outline" onClick={() => router.back()} className="mt-8 rounded-xl px-8 border-border">
          Go Back
        </Button>
      </div>
    );
  }

  const finance = partner.financeAccounts || { available: 0, pending: 0, fee: 0 };

  return (
    <div className="space-y-5 pb-10 max-w-7xl mx-auto px-4 md:px-0 text-foreground">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest gap-2">
          <Link href="/merchants" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Merchants
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">Partner Profile</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            Business Partner Profile
          </h1>
          <div className="flex items-center gap-2">
            <Link href={`/merchants/${partnerId}/edit`}>
              <Button variant="outline" size="sm" className="h-9 rounded-xl border-border">
                <FileText className="w-4 h-4 mr-2 text-amber-500" />
                Edit Profile
              </Button>
            </Link>
            <Link href={`/merchants/${partnerId}/terminals`}>
              <Button variant="outline" size="sm" className="h-9 rounded-xl border-border">
                <Settings className="w-4 h-4 mr-2" />
                Manage Terminals
              </Button>
            </Link>
            <Button size="sm" className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
              Update Status
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {/* Main Info Card */}
          <Card className="border-none shadow-xs bg-card text-card-foreground overflow-hidden rounded-[2rem]">
            <div className="h-24 bg-gradient-to-r from-emerald-600 to-teal-600 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            </div>
            <CardHeader className="relative pb-0">
              <div className="absolute -top-12 left-8 p-1.5 bg-card rounded-[1.5rem] shadow-lg">
                <div className="w-16 h-16 rounded-[1.2rem] bg-slate-950 dark:bg-black flex items-center justify-center text-white">
                  <Building2 className="w-8 h-8 text-emerald-400" />
                </div>
              </div>
              <div className="pl-28 pt-2 pb-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-black text-foreground tracking-tight">
                    {partner.name}
                  </h3>
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[10px] font-black rounded-lg">
                    {partner.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-muted-foreground text-xs">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    TAX ID: <span className="font-mono font-bold">{partner.taxId || 'N/A'}</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    Joined {new Date(partner.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-4 grid md:grid-cols-2 gap-8 border-t border-border mt-4">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <CreditCard className="w-3 h-3" /> Capabilities
                </h4>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted ring-1 ring-border">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-bold text-foreground">Payment Processing</span>
                    </div>
                    <Badge variant={partner.isPaymentEnabled ? "default" : "secondary"} className={partner.isPaymentEnabled ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}>
                      {partner.isPaymentEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted ring-1 ring-border">
                    <div className="flex items-center gap-3">
                      <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-bold text-foreground">Loyalty Rewards</span>
                    </div>
                    <Badge variant={partner.isLoyaltyEnabled ? "default" : "secondary"} className={partner.isLoyaltyEnabled ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}>
                      {partner.isLoyaltyEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Wallet className="w-3 h-3" /> Finance Accounts
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
                    <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">Available Balance</p>
                    <div className="text-xl font-black text-foreground mt-1">
                      {Number(finance.available || 0).toLocaleString()}
                      <span className="text-[10px] ml-1 text-muted-foreground font-bold uppercase">THB</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
                    <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tighter">Pending Clear</p>
                    <div className="text-xl font-black text-foreground mt-1">
                      {Number(finance.pending || 0).toLocaleString()}
                      <span className="text-[10px] ml-1 text-muted-foreground font-bold uppercase">THB</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Building2 className="w-3 h-3" /> Official Profile
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">En Business Name</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{partner.profile?.businessNameEn || 'Not Provided'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Registered Address</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {partner.profile?.address || 'N/A'}
                      {partner.profile?.addressDetail && <span className="block mt-0.5 text-muted-foreground italic">{partner.profile.addressDetail}</span>}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xs bg-card text-card-foreground overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-muted/30 border-b border-border px-8 py-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Corporate Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 grid md:grid-cols-2 gap-6">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Contact Person</p>
                    <p className="text-sm font-bold text-foreground">{partner.profile?.contactName || 'N/A'}</p>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Email Address</p>
                    <p className="text-sm font-bold text-foreground">{partner.profile?.email || 'N/A'}</p>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Phone Number</p>
                    <p className="text-sm font-bold text-foreground">{partner.profile?.phone || 'N/A'}</p>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Website</p>
                    <p className="text-sm font-bold text-foreground break-all">{partner.profile?.website || 'N/A'}</p>
                  </div>
               </div>
            </CardContent>
          </Card>

          {/* Merchants / Branches List */}
          <Card className="border-none shadow-xs bg-card text-card-foreground overflow-hidden rounded-[2rem]">
            <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Merchant Branches</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Managed locations and outlet nodes.</p>
              </div>
              {partner.type !== 'SME' && (
                <Button size="sm" variant="outline" className="h-9 rounded-xl border-border font-bold text-xs" onClick={() => setIsMerchantModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Add Branch
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="grid gap-3">
                {merchants.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-2xl">
                    No branches configured yet.
                  </div>
                ) : (
                  merchants.map((m) => (
                    <div key={m.id} className="p-4 rounded-2xl bg-muted/50 border border-border flex items-center justify-between group hover:bg-indigo-500/10 hover:border-indigo-500/20 text-card-foreground transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-foreground text-sm">{m.name}</div>
                          <div className="text-[10px] text-muted-foreground font-medium">{m.address || 'No address set'}</div>
                        </div>
                      </div>
                      <Link href={`/merchants/${partnerId}/terminals`}>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400">
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="border-none shadow-xs bg-card text-card-foreground rounded-[2rem] overflow-hidden">
            <CardHeader className="p-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                Partner Status
                <Shield className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-muted border border-border flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${partner.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'}`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground uppercase">Verification Level</div>
                    <div className="text-[10px] text-muted-foreground">Fully verified tax entity</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Nodes</span>
                    <span className="text-sm font-black text-foreground">{merchants.length} สาขา</span>
                  </div>
                  <Link href={`/merchants/${partnerId}/terminals`} className="block w-full">
                    <Button variant="outline" className="w-full justify-between h-10 rounded-xl text-muted-foreground border-border font-bold text-[10px] uppercase tracking-wider">
                      Manage Registered Terminals
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Merchant Modal */}
      <Dialog open={isMerchantModalOpen} onOpenChange={setIsMerchantModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-card text-card-foreground">
          <form onSubmit={handleCreateMerchant}>
            <div className="p-8 pb-4">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/10 rounded-xl">
                    <Store className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  Add New Branch
                </DialogTitle>
                <DialogDescription className="text-muted-foreground pt-2 text-sm leading-relaxed">
                  Register a new physical location or outlet for this partner.
                </DialogDescription>
              </DialogHeader>
 
              <div className="space-y-6 py-6">
                <div className="space-y-2">
                  <Label htmlFor="m-name" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Branch Name</Label>
                  <Input
                    id="m-name"
                    placeholder="e.g. Siam Square Branch"
                    value={newMerchantName}
                    onChange={(e) => setNewMerchantName(e.target.value)}
                    required
                    className="h-12 rounded-xl bg-muted border-border focus:ring-indigo-500 font-bold text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-address" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Address (Optional)</Label>
                  <Textarea
                    id="m-address"
                    placeholder="Physical location of the store"
                    value={newMerchantAddress}
                    onChange={(e) => setNewMerchantAddress(e.target.value)}
                    className="rounded-xl bg-muted border-border focus:ring-indigo-500 min-h-[80px] text-foreground"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="p-8 pt-0 flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsMerchantModalOpen(false)} className="rounded-xl font-bold flex-1 h-12">Cancel</Button>
              <Button type="submit" disabled={submitting} className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex-1 h-12 shadow-xs">
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Add Branch'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

