'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ChevronRight,
  Info,
  Save,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Store,
  Loader2,
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { merchantRequester } from '@/lib/requesters/merchantRequester';

interface EditPartnerPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPartnerPage({ params }: EditPartnerPageProps) {
  const { id: partnerId } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    taxId: '',
    profile: {
      businessNameEn: '',
      category: 'CORPORATE',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      addressDetail: '',
      website: '',
      logoUrl: '',
    },
  });

  useEffect(() => {
    const fetchPartner = async () => {
      try {
        const partner = await merchantRequester.getPartnerDetail(partnerId);

        setFormData({
          name: partner.name || '',
          taxId: partner.taxId || '',
          profile: {
            businessNameEn: partner.profile?.businessNameEn || '',
            category: partner.profile?.category || 'CORPORATE',
            contactName: partner.profile?.contactName || '',
            email: partner.profile?.email || '',
            phone: partner.profile?.phone || '',
            address: partner.profile?.address || '',
            addressDetail: partner.profile?.addressDetail || '',
            website: partner.profile?.website || '',
            logoUrl: partner.profile?.logoUrl || '',
          },
        });
      } catch (error) {
        console.error('[EDIT_PARTNER] Fetch error:', error);
        toast.error('Failed to load partner details');
        router.push('/support/merchants');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPartner();
  }, [partnerId, router]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const thaiRegex = /^[ก-๙\s0-9.()/-]+$/;

    if (!formData.name.trim()) {
      newErrors.name = 'Corporate name (Thai) is required';
    } else if (!thaiRegex.test(formData.name)) {
      newErrors.name =
        'Corporate name must contain only Thai characters, numbers, and symbols';
    }

    if (!formData.taxId.trim())
      newErrors.taxId = 'Tax Identification Number is required';
    if (!formData.profile.contactName.trim())
      newErrors.contactName = 'Contact name is required';
    if (!formData.profile.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.profile.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.profile.phone.trim())
      newErrors.phone = 'Phone number is required';
    if (!formData.profile.address.trim())
      newErrors.address = 'Registered address is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Please check the required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      await merchantRequester.updatePartner(partnerId, formData);
      toast.success('Partner profile updated successfully');
      router.push(`/support/merchants/${partnerId}`);
      router.refresh();
    } catch (error) {
      console.error('[EDIT_PARTNER] Submit error:', error);
      toast.error('Failed to update partner. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-foreground">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
          <p className="text-muted-foreground font-bold animate-pulse uppercase tracking-widest text-[10px]">
            Loading Profile...
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6 pb-20 max-w-6xl mx-auto px-4 md:px-0 text-foreground">
        {/* Header & Navigation */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center text-[10px] font-black text-muted-foreground uppercase tracking-widest gap-2">
            <Link
              href="/support/merchants"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Merchants
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link
              href={`/support/merchants/${partnerId}`}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Partner Profile
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Edit Corporate Data</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-xs">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-amber-500" />
                  Updating this data will reflect across all branches and
                  terminals.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="h-9 rounded-lg text-muted-foreground font-bold uppercase text-[10px] tracking-wider"
              >
                Discard Changes
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-10 px-6 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-black font-bold uppercase text-xs tracking-wider shadow-xs transition-all active:scale-95"
              >
                {isSubmitting ? (
                  'Saving...'
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-3.5 h-3.5" />
                    Save Changes
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Row 1: Legal Entity (Left) & Contact (Right) */}
          <div className="lg:col-span-2 flex flex-col">
            <Card className="flex-1 border-none shadow-xs bg-card text-card-foreground overflow-hidden rounded-2xl">
              <CardHeader className="bg-muted/30 border-b border-border px-6 py-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Legal Entity Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                      Corporate Name (Thai){' '}
                      <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      placeholder="บจก. ตัวอย่าง คอร์ปอเรชั่น"
                      value={formData.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, name: val });

                        // Real-time validation
                        const thaiRegex = /^[ก-๙\s0-9.()/-]+$/;
                        if (!val.trim()) {
                          setErrors((prev) => ({
                            ...prev,
                            name: 'Corporate name (Thai) is required',
                          }));
                        } else if (!thaiRegex.test(val)) {
                          setErrors((prev) => ({
                            ...prev,
                            name: 'Corporate name must contain only Thai characters, numbers, and symbols',
                          }));
                        } else {
                          setErrors((prev) => ({ ...prev, name: '' }));
                        }
                      }}
                      className={`h-11 rounded-xl border-border focus:ring-indigo-500 font-bold text-foreground bg-muted ${errors.name ? 'border-rose-500 bg-rose-500/10' : ''}`}
                    />
                    {errors.name && (
                      <p className="text-[10px] text-rose-500 font-bold ml-1 uppercase">
                        {errors.name}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                        Business Name (English){' '}
                        <span className="text-muted-foreground lowercase font-normal italic">
                          (Optional)
                        </span>
                      </Label>
                      <Input
                        placeholder="Example Corporation Co., Ltd."
                        value={formData.profile.businessNameEn}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            profile: {
                              ...formData.profile,
                              businessNameEn: e.target.value,
                            },
                          })
                        }
                        className="h-11 rounded-xl border-border focus:ring-indigo-500 font-bold text-foreground bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                        Tax Identification Number{' '}
                        <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        placeholder="13-digit number"
                        value={formData.taxId}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\D/g, '')
                            .slice(0, 13);
                          setFormData({ ...formData, taxId: val });

                          if (val.length < 13 && val.length > 0) {
                            setErrors((prev) => ({
                              ...prev,
                              taxId: 'Tax ID must be 13 digits',
                            }));
                          } else if (val.length === 0) {
                            setErrors((prev) => ({
                              ...prev,
                              taxId: 'Tax ID is required',
                            }));
                          } else {
                            setErrors((prev) => ({ ...prev, taxId: '' }));
                          }
                        }}
                        className={`h-11 rounded-xl border-border focus:ring-indigo-500 font-mono font-bold text-foreground bg-muted ${errors.taxId ? 'border-rose-500 bg-rose-500/10' : ''}`}
                      />
                      {errors.taxId && (
                        <p className="text-[10px] text-rose-500 font-bold ml-1 uppercase">
                          {errors.taxId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 flex flex-col">
            <Card className="flex-1 border-none shadow-xs bg-card text-card-foreground overflow-hidden rounded-2xl">
              <CardHeader className="bg-muted/30 border-b border-border px-6 py-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Contact Person
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                    Full Name <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground transition-colors" />
                    <Input
                      className={`pl-10 h-10 rounded-xl border-border focus:ring-indigo-500 font-bold text-foreground bg-muted ${errors.contactName ? 'border-rose-500 bg-rose-500/10' : ''}`}
                      placeholder="Manager Name"
                      value={formData.profile.contactName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          profile: { ...formData.profile, contactName: val },
                        });
                        if (!val.trim()) {
                          setErrors((prev) => ({
                            ...prev,
                            contactName: 'Contact name is required',
                          }));
                        } else {
                          setErrors((prev) => ({ ...prev, contactName: '' }));
                        }
                      }}
                    />
                  </div>
                  {errors.contactName && (
                    <p className="text-[10px] text-rose-500 font-bold ml-1 uppercase">
                      {errors.contactName}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                    Email <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground transition-colors" />
                    <Input
                      className={`pl-10 h-10 rounded-xl border-border focus:ring-indigo-500 font-bold text-foreground bg-muted ${errors.email ? 'border-rose-500 bg-rose-500/10' : ''}`}
                      placeholder="corporate@brand.com"
                      value={formData.profile.email}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          profile: { ...formData.profile, email: val },
                        });
                        const emailRegex = /\S+@\S+\.\S+/;
                        if (!val.trim()) {
                          setErrors((prev) => ({
                            ...prev,
                            email: 'Email address is required',
                          }));
                        } else if (!emailRegex.test(val)) {
                          setErrors((prev) => ({
                            ...prev,
                            email: 'Invalid email format',
                          }));
                        } else {
                          setErrors((prev) => ({ ...prev, email: '' }));
                        }
                      }}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[10px] text-rose-500 font-bold ml-1 uppercase">
                      {errors.email}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                    Phone <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground transition-colors" />
                    <Input
                      className={`pl-10 h-10 rounded-xl border-border focus:ring-indigo-500 font-bold text-foreground bg-muted ${errors.phone ? 'border-rose-500 bg-rose-500/10' : ''}`}
                      placeholder="08XXXXXXXX"
                      value={formData.profile.phone}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 10);
                        setFormData({
                          ...formData,
                          profile: { ...formData.profile, phone: val },
                        });

                        if (val.length < 9 && val.length > 0) {
                          setErrors((prev) => ({
                            ...prev,
                            phone: 'Phone number is too short',
                          }));
                        } else if (val.length === 0) {
                          setErrors((prev) => ({
                            ...prev,
                            phone: 'Phone number is required',
                          }));
                        } else {
                          setErrors((prev) => ({ ...prev, phone: '' }));
                        }
                      }}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-[10px] text-rose-500 font-bold ml-1 uppercase">
                      {errors.phone}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Address (Left) & Branding (Right) */}
          <div className="lg:col-span-2 flex flex-col">
            <Card className="flex-1 border-none shadow-xs bg-card text-card-foreground overflow-hidden rounded-2xl">
              <CardHeader className="bg-muted/30 border-b border-border px-6 py-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  Registered Address
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                    Full Address <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    placeholder="Street, District, Province, Postal Code"
                    value={formData.profile.address}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        profile: {
                          ...formData.profile,
                          address: e.target.value,
                        },
                      });
                      if (errors.address) setErrors({ ...errors, address: '' });
                    }}
                    className={`h-11 rounded-xl border-border focus:ring-indigo-500 font-bold text-foreground bg-muted ${errors.address ? 'border-rose-500 bg-rose-500/10' : ''}`}
                  />
                  {errors.address && (
                    <p className="text-[10px] text-rose-500 font-bold ml-1 uppercase">
                      {errors.address}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                    Additional Details{' '}
                    <span className="text-muted-foreground lowercase font-normal italic">
                      (Optional)
                    </span>
                  </Label>
                  <Input
                    placeholder="e.g. 25th Floor, Ocean Tower 2"
                    value={formData.profile.addressDetail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        profile: {
                          ...formData.profile,
                          addressDetail: e.target.value,
                        },
                      })
                    }
                    className="h-11 rounded-xl border-border focus:ring-indigo-500 font-bold text-foreground bg-muted"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 flex flex-col">
            <Card className="flex-1 border-none shadow-xs bg-card text-card-foreground overflow-hidden rounded-2xl">
              <CardHeader className="bg-muted/30 border-b border-border px-6 py-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Branding & Online
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                    Website{' '}
                    <span className="text-muted-foreground lowercase font-normal italic">
                      (Optional)
                    </span>
                  </Label>
                  <div className="relative group">
                    <Globe className="absolute left-3 top-3 w-4 h-4 text-muted-foreground transition-colors" />
                    <Input
                      className="pl-10 h-10 rounded-xl border-border focus:ring-indigo-500 font-bold text-foreground bg-muted"
                      placeholder="https://www.brand.com"
                      value={formData.profile.website}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          profile: {
                            ...formData.profile,
                            website: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                    Logo URL{' '}
                    <span className="text-muted-foreground lowercase font-normal italic">
                      (Optional)
                    </span>
                  </Label>
                  <div className="relative group">
                    <Store className="absolute left-3 top-3 w-4 h-4 text-muted-foreground transition-colors" />
                    <Input
                      className="pl-10 h-10 rounded-xl border-border focus:ring-indigo-500 font-bold text-foreground bg-muted"
                      placeholder="https://img.brand.com/logo.png"
                      value={formData.profile.logoUrl}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          profile: {
                            ...formData.profile,
                            logoUrl: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
}
