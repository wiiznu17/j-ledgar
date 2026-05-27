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
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { showConfirm } from '@/lib/swal';

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

  // Review states
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [updatingCapabilities, setUpdatingCapabilities] = useState(false);

  const handleReview = async (
    id: string,
    newStatus: 'APPROVED' | 'REJECTED',
  ) => {
    if (newStatus === 'REJECTED') {
      setSelectedAppId(id);
      setRejectionNote('');
      setIsRejectDialogOpen(true);
      return;
    }

    const confirmResult = await showConfirm(
      'Approve Merchant Partner?',
      'Are you sure you want to approve this merchant application? This will activate their partnership profile, automatically provision real ledger accounts, and generate default hardware terminal configurations.',
    );

    if (confirmResult.isConfirmed) {
      await processReview(id, 'APPROVED');
    }
  };

  const processReview = async (
    id: string,
    status: 'APPROVED' | 'REJECTED',
    note?: string,
  ) => {
    const promise = merchantRequester.reviewApplication(id, {
      status,
      note:
        note || `Reviewed via Admin Portal at ${new Date().toLocaleString()}`,
    });

    toast.promise(promise, {
      loading: `Processing ${status.toLowerCase()}...`,
      success: () => {
        fetchData();
        setIsRejectDialogOpen(false);
        return `Application ${status.toLowerCase()} successfully`;
      },
      error: 'Failed to process application review',
    });
  };

  const handleConfirmReject = () => {
    if (!selectedAppId) return;
    if (!rejectionNote.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    processReview(selectedAppId, 'REJECTED', rejectionNote);
  };

  const handleToggleCapability = async (
    field: 'isPaymentEnabled' | 'isLoyaltyEnabled',
  ) => {
    try {
      setUpdatingCapabilities(true);
      const updatedVal = !partner[field];

      const promise = merchantRequester.updatePartner(partnerId, {
        [field]: updatedVal,
      });

      toast.promise(promise, {
        loading: 'Updating capability...',
        success: () => {
          fetchData();
          return `${
            field === 'isPaymentEnabled' ? 'Payment processing' : 'Loyalty rewards'
          } capability updated successfully`;
        },
        error: 'Failed to update merchant capability',
      });
    } catch (error) {
      console.error(`Error toggling capability ${field}`, error);
      toast.error('Failed to update merchant capability');
    } finally {
      setUpdatingCapabilities(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [p, m] = await Promise.all([
        merchantRequester.getPartnerDetail(partnerId),
        merchantRequester.getPartnerMerchants(partnerId),
      ]);
      setPartner(p);
      setMerchants(m || []);
    } catch (error) {
      console.error('Error fetching partner details', error);
      toast.error('Failed to load partner information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (partnerId) fetchData();
  }, [partnerId]);

  const handleCreateMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await merchantRequester.createMerchant(partnerId, {
        name: newMerchantName,
        address: newMerchantAddress,
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
        <h2 className="text-2xl font-bold text-foreground">
          Partner Not Found
        </h2>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mt-8 rounded-xl px-8 border-border"
        >
          Go Back
        </Button>
      </div>
    );
  }

  const finance = partner.financeAccounts || {
    available: 0,
    pending: 0,
    fee: 0,
  };
  const pendingApplication = partner.applications?.find(
    (app: any) => app.status === 'PENDING',
  );

  return (
    <div className="space-y-5 pb-10 max-w-7xl mx-auto px-4 md:px-0 text-foreground">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest gap-2">
          <Link
            href="/support/merchants"
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Merchants
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">Partner Profile</span>
        </div>

        <div />
        <div className="flex items-center gap-2">
          <Link href={`/support/merchants/${partnerId}/edit`}>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-border"
            >
              <FileText className="w-4 h-4 mr-2 text-amber-500" />
              Edit Profile
            </Button>
          </Link>
          <Link href={`/support/merchants/${partnerId}/terminals`}>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-border"
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage Terminals
            </Button>
          </Link>
        </div>
      </div>

      {/* Pending Application Review Alert */}
      {partner.status === 'PENDING_REVIEW' && pendingApplication && (
        <Card className="border border-amber-500/20 bg-amber-500/5 rounded-[2rem] overflow-hidden shadow-xs">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex gap-4">
                <div className="p-3 bg-amber-500/10 rounded-2xl h-fit text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-foreground">
                    Merchant Partnership Pending Review
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                    This merchant partner has submitted a request to join the
                    ecosystem. Review their profile details, business
                    registration, tax ID, and contact details below before
                    deciding.
                  </p>
                  {pendingApplication.createdAt && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider pt-1">
                      Submitted:{' '}
                      {new Date(pendingApplication.createdAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <Button
                  variant="outline"
                  className="flex-1 md:flex-none h-11 px-6 rounded-2xl border-rose-500/20 text-rose-600 hover:bg-rose-500/10 font-bold text-xs uppercase tracking-wider"
                  onClick={() => {
                    setSelectedAppId(pendingApplication.id);
                    setRejectionNote('');
                    setIsRejectDialogOpen(true);
                  }}
                >
                  Reject Request
                </Button>
                <Button
                  className="flex-1 md:flex-none h-11 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-xs"
                  onClick={() =>
                    handleReview(pendingApplication.id, 'APPROVED')
                  }
                >
                  Approve Request
                </Button>
              </div>
            </div>

            {/* Applicant Details Grid */}
            <div className="pt-6 border-t border-amber-500/10 space-y-6">
              <h5 className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2">
                Submitted Application Details (ข้อมูลที่ยื่นประกอบการสมัคร)
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 bg-card p-5 rounded-2xl border border-border shadow-xs">
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    Business Name
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {pendingApplication.businessName || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    Category
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {pendingApplication.category || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    Contact Person
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {pendingApplication.contactName || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    Contact Email & Phone
                  </p>
                  <p className="text-xs font-bold text-foreground mt-0.5">
                    {pendingApplication.email || 'N/A'}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    {pendingApplication.phone || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Uploaded Documents / Images */}
              {pendingApplication.images &&
                pendingApplication.images.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                      Uploaded Documents & Photos
                      (เอกสารและรูปภาพประกอบการสมัคร)
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {pendingApplication.images.map(
                        (img: string, idx: number) => (
                          <div
                            key={idx}
                            className="relative group cursor-pointer overflow-hidden rounded-2xl border border-border bg-muted/30 hover:shadow-md transition-all"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img}
                              alt={`Merchant Doc ${idx + 1}`}
                              className="h-20 w-28 object-cover transition-transform duration-300 group-hover:scale-105"
                              onClick={() => window.open(img, '_blank')}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                              <span className="text-[9px] font-black text-white uppercase tracking-wider bg-black/60 px-2 py-0.5 rounded-full scale-90">
                                Open Image
                              </span>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left Column: Profile Info & Branches */}
        <div className="lg:col-span-2 space-y-5">
          {/* Main Info Card */}
          <Card className="border-none shadow-xs bg-card text-card-foreground overflow-hidden rounded-[2rem]">
            <CardHeader className="p-8 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="w-16 h-16 rounded-[1.2rem] bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <Building2 className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black text-foreground tracking-tight">
                      {partner.name}
                    </h3>
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[10px] font-black rounded-lg">
                      {partner.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-muted-foreground text-xs">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      Joined {new Date(partner.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-6 border-t border-border space-y-6">
              <div>
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Building2 className="w-3 h-3 text-emerald-500" /> Official
                  Profile Details
                </h4>
                <div className="grid md:grid-cols-2 gap-6 bg-muted/30 p-5 rounded-2xl border border-border">
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                      En Business Name
                    </p>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {partner.profile?.businessNameEn || 'Not Provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                      Tax Identification Number (TAX ID)
                    </p>
                    <p className="text-sm font-mono font-bold text-foreground mt-0.5">
                      {partner.taxId || 'N/A'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                      Registered Address
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {partner.profile?.address || 'N/A'}
                      {partner.profile?.addressDetail && (
                        <span className="block mt-0.5 text-muted-foreground italic font-medium">
                          {partner.profile.addressDetail}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Merchants / Branches List */}
          <Card className="border-none shadow-xs bg-card text-card-foreground overflow-hidden rounded-[2rem]">
            <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                  Merchant Branches
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Managed locations and outlet nodes.
                </p>
              </div>
              {partner.type !== 'SME' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-xl border-border font-bold text-xs"
                  onClick={() => setIsMerchantModalOpen(true)}
                >
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
                    <div
                      key={m.id}
                      className="p-4 rounded-2xl bg-muted/50 border border-border flex items-center justify-between group hover:bg-indigo-500/10 hover:border-indigo-500/20 text-card-foreground transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-foreground text-sm">
                            {m.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium">
                            {m.address || 'No address set'}
                          </div>
                        </div>
                      </div>
                      <Link href={`/support/merchants/${partnerId}/terminals`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400"
                        >
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

        {/* Right Column: Status, Capabilities, Finance, Contacts */}
        <div className="space-y-5">
          {/* Partner Status Card */}
          <Card className="border-none shadow-xs bg-card text-card-foreground rounded-[2rem] overflow-hidden">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                Partner Status
                <Shield className="w-4 h-4 text-indigo-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="p-4 rounded-2xl bg-muted border border-border flex items-center gap-4">
                <div
                  className={`p-2 rounded-lg ${
                    partner.status === 'ACTIVE'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : partner.status === 'REJECTED'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {partner.status === 'ACTIVE' ? (
                    <ShieldCheck className="w-5 h-5" />
                  ) : partner.status === 'REJECTED' ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : (
                    <Shield className="w-5 h-5 animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground uppercase">
                    Verification Level
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {partner.status === 'ACTIVE'
                      ? 'Fully verified tax entity'
                      : partner.status === 'REJECTED'
                      ? 'Verification failed - Requires review'
                      : 'Awaiting compliance review'}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Active Nodes
                  </span>
                  <span className="text-sm font-black text-foreground">
                    {merchants.length} สาขา
                  </span>
                </div>
                <Link
                  href={`/support/merchants/${partnerId}/terminals`}
                  className="block w-full"
                >
                  <Button
                    variant="outline"
                    className="w-full justify-between h-10 rounded-xl text-muted-foreground border-border font-bold text-[10px] uppercase tracking-wider"
                  >
                    Manage Registered Terminals
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Finance Accounts Card */}
          <Card className="border-none shadow-xs bg-card text-card-foreground rounded-[2rem] overflow-hidden">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                Finance & Capabilities
                <Wallet className="w-4 h-4 text-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
                  <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                    Available Balance
                  </p>
                  <div className="text-lg font-black text-foreground mt-1">
                    {Number(finance.available || 0).toLocaleString()}
                    <span className="text-[9px] ml-1 text-muted-foreground font-bold uppercase">
                      THB
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
                  <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tighter">
                    Pending Clear
                  </p>
                  <div className="text-lg font-black text-foreground mt-1">
                    {Number(finance.pending || 0).toLocaleString()}
                    <span className="text-[9px] ml-1 text-muted-foreground font-bold uppercase">
                      THB
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted ring-1 ring-border">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-bold text-foreground">
                      Payment Processing
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleCapability('isPaymentEnabled')}
                    disabled={updatingCapabilities || partner.status !== 'ACTIVE'}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      partner.isPaymentEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                    } ${partner.status !== 'ACTIVE' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={partner.status !== 'ACTIVE' ? 'Requires partner to be active' : ''}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        partner.isPaymentEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted ring-1 ring-border">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-bold text-foreground">
                      Loyalty Rewards
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleCapability('isLoyaltyEnabled')}
                    disabled={updatingCapabilities || partner.status !== 'ACTIVE'}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      partner.isLoyaltyEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                    } ${partner.status !== 'ACTIVE' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={partner.status !== 'ACTIVE' ? 'Requires partner to be active' : ''}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        partner.isLoyaltyEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Corporate Contact Card */}
          <Card className="border-none shadow-xs bg-card text-card-foreground overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-muted/30 border-b border-border px-6 py-4">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-indigo-500" /> Corporate
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    Contact Person
                  </p>
                  <p className="text-xs font-bold text-foreground">
                    {partner.profile?.contactName || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    Email Address
                  </p>
                  <p className="text-xs font-bold text-foreground break-all">
                    {partner.profile?.email || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    Phone Number
                  </p>
                  <p className="text-xs font-bold text-foreground">
                    {partner.profile?.phone || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    Website
                  </p>
                  <p className="text-xs font-bold text-foreground break-all">
                    {partner.profile?.website || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Merchant Modal */}
      <Dialog open={isMerchantModalOpen} onOpenChange={setIsMerchantModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-card text-card-foreground">
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
                  <Label
                    htmlFor="m-name"
                    className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1"
                  >
                    Branch Name
                  </Label>
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
                  <Label
                    htmlFor="m-address"
                    className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1"
                  >
                    Address (Optional)
                  </Label>
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
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsMerchantModalOpen(false)}
                className="rounded-xl font-bold flex-1 h-12"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex-1 h-12 shadow-xs"
              >
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

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-5 h-5" />
              Reject Application
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Please provide a reason for rejecting this merchant application.
              This note will be visible to the applicant.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="e.g. Identity documents are blurry, please re-upload."
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              className="min-h-[100px] bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsRejectDialogOpen(false)}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmReject}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
