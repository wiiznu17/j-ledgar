'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  ArrowLeft, 
  Save, 
  Globe, 
  Mail, 
  Phone, 
  User, 
  MapPin, 
  Info,
  ChevronRight,
  Store
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { merchantRequester } from '@/lib/requesters';

export default function CreatePartnerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
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
    }
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const thaiRegex = /^[ก-๙\s0-9.()/-]+$/;

    if (!formData.name.trim()) {
      newErrors.name = 'Corporate name (Thai) is required';
    } else if (!thaiRegex.test(formData.name)) {
      newErrors.name = 'Corporate name must contain only Thai characters, numbers, and symbols';
    }

    if (!formData.taxId.trim()) newErrors.taxId = 'Tax Identification Number is required';
    if (!formData.profile.contactName.trim()) newErrors.contactName = 'Contact name is required';
    if (!formData.profile.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.profile.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.profile.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.profile.address.trim()) newErrors.address = 'Registered address is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) {
      toast.error('Please check the required fields');
      return;
    }
    
    setIsLoading(true);
    try {
      await merchantRequester.createPartner({
        ...formData,
        profile: {
            ...formData.profile,
            category: 'CORPORATE'
        }
      });
      toast.success('Corporate partner created successfully');
      router.push('/merchants');
      router.refresh();
    } catch (error) {
      console.error('[CREATE_PARTNER] Error:', error);
      toast.error('Failed to create partner. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto px-4 md:px-0">
      {/* Header & Navigation */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest gap-2">
          <Link href="/merchants" className="hover:text-indigo-600 transition-colors">Merchants</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900">Onboard Big Brand</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Onboard Corporate Partner</h1>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-indigo-500" />
                Registering a big brand will automatically set status to <span className="text-emerald-600 font-bold">ACTIVE</span>.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <Button 
                onClick={handleSubmit} 
                disabled={isLoading}
                className="h-10 px-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-95"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Register Partner
                    <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Row 1: Legal Entity (Left) & Contact (Right) */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="flex-1 border-none shadow-sm ring-1 ring-slate-100 bg-white overflow-hidden rounded-2xl">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                Legal Entity Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Corporate Name (Thai) <span className="text-rose-500">*</span>
                  </Label>
                  <Input 
                    placeholder="บจก. ตัวอย่าง คอร์ปอเรชั่น" 
                    value={formData.name}
                    onChange={(e) => {
                        const val = e.target.value;
                        setFormData({...formData, name: val});
                        
                        // Real-time validation
                        const thaiRegex = /^[ก-๙\s0-9.()/-]+$/;
                        if (!val.trim()) {
                            setErrors(prev => ({...prev, name: 'Corporate name (Thai) is required'}));
                        } else if (!thaiRegex.test(val)) {
                            setErrors(prev => ({...prev, name: 'Corporate name must contain only Thai characters, numbers, and symbols'}));
                        } else {
                            setErrors(prev => ({...prev, name: ''}));
                        }
                    }}
                    className={`h-11 rounded-xl border-slate-200 focus:ring-indigo-500 font-bold text-slate-800 ${errors.name ? 'border-rose-400 bg-rose-50/50' : ''}`}
                  />
                  {errors.name && <p className="text-[10px] text-rose-500 font-bold ml-1 uppercase">{errors.name}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Business Name (English) <span className="text-slate-300 lowercase font-normal italic">(Optional)</span>
                        </Label>
                        <Input 
                            placeholder="Example Corporation Co., Ltd." 
                            value={formData.profile.businessNameEn}
                            onChange={(e) => setFormData({
                                ...formData, 
                                profile: {...formData.profile, businessNameEn: e.target.value}
                            })}
                            className="h-11 rounded-xl border-slate-200 focus:ring-indigo-500 font-bold text-slate-800"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Tax Identification Number <span className="text-rose-500">*</span>
                        </Label>
                        <Input 
                            placeholder="13-digit number" 
                            value={formData.taxId}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 13);
                                setFormData({...formData, taxId: val});
                                
                                if (val.length < 13 && val.length > 0) {
                                    setErrors(prev => ({...prev, taxId: 'Tax ID must be 13 digits'}));
                                } else if (val.length === 0) {
                                    setErrors(prev => ({...prev, taxId: 'Tax ID is required'}));
                                } else {
                                    setErrors(prev => ({...prev, taxId: ''}));
                                }
                            }}
                            className={`h-11 rounded-xl border-slate-200 focus:ring-indigo-500 font-mono font-bold text-slate-800 ${errors.taxId ? 'border-rose-400 bg-rose-50/50' : ''}`}
                        />
                        {errors.taxId && <p className="text-[10px] text-rose-500 font-bold ml-1 uppercase">{errors.taxId}</p>}
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 flex flex-col">
          <Card className="flex-1 border-none shadow-sm ring-1 ring-slate-100 bg-white overflow-hidden rounded-2xl">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Contact Person
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name <span className="text-rose-500">*</span></Label>
                <div className="relative group">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-300 transition-colors" />
                  <Input 
                    className={`pl-10 h-10 rounded-xl border-slate-200 focus:ring-indigo-500 font-bold text-slate-800 ${errors.contactName ? 'border-rose-400 bg-rose-50/50' : ''}`}
                    placeholder="Manager Name"
                    value={formData.profile.contactName}
                    onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                            ...formData, 
                            profile: {...formData.profile, contactName: val}
                        });
                        if (!val.trim()) {
                            setErrors(prev => ({...prev, contactName: 'Contact name is required'}));
                        } else {
                            setErrors(prev => ({...prev, contactName: ''}));
                        }
                    }}
                  />
                </div>
                {errors.contactName && <p className="text-[10px] text-rose-500 font-bold ml-1 uppercase">{errors.contactName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email <span className="text-rose-500">*</span></Label>
                <div className="relative group">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-300 transition-colors" />
                <Input 
                    className={`pl-10 h-10 rounded-xl border-slate-200 focus:ring-indigo-500 font-bold text-slate-800 ${errors.email ? 'border-rose-400 bg-rose-50/50' : ''}`}
                    placeholder="corporate@brand.com"
                    value={formData.profile.email}
                    onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                            ...formData, 
                            profile: {...formData.profile, email: val}
                        });
                        const emailRegex = /\S+@\S+\.\S+/;
                        if (!val.trim()) {
                            setErrors(prev => ({...prev, email: 'Email address is required'}));
                        } else if (!emailRegex.test(val)) {
                            setErrors(prev => ({...prev, email: 'Invalid email format'}));
                        } else {
                            setErrors(prev => ({...prev, email: ''}));
                        }
                    }}
                />
                </div>
                {errors.email && <p className="text-[10px] text-rose-500 font-bold ml-1 uppercase">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone <span className="text-rose-500">*</span></Label>
                <div className="relative group">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-300 transition-colors" />
                <Input 
                    className={`pl-10 h-10 rounded-xl border-slate-200 focus:ring-indigo-500 font-bold text-slate-800 ${errors.phone ? 'border-rose-400 bg-rose-50/50' : ''}`}
                    placeholder="08XXXXXXXX"
                    value={formData.profile.phone}
                    onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({
                            ...formData, 
                            profile: {...formData.profile, phone: val}
                        });
                        
                        if (val.length < 9 && val.length > 0) {
                            setErrors(prev => ({...prev, phone: 'Phone number is too short'}));
                        } else if (val.length === 0) {
                            setErrors(prev => ({...prev, phone: 'Phone number is required'}));
                        } else {
                            setErrors(prev => ({...prev, phone: ''}));
                        }
                    }}
                />
                </div>
                {errors.phone && <p className="text-[10px] text-rose-500 font-bold ml-1 uppercase">{errors.phone}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Address (Left) & Branding (Right) */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="flex-1 border-none shadow-sm ring-1 ring-slate-100 bg-white overflow-hidden rounded-2xl">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                Registered Address
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Full Address <span className="text-rose-500">*</span>
                </Label>
                <Input 
                  placeholder="Street, District, Province, Postal Code" 
                  value={formData.profile.address}
                  onChange={(e) => {
                    setFormData({
                        ...formData, 
                        profile: {...formData.profile, address: e.target.value}
                    });
                    if (errors.address) setErrors({...errors, address: ''});
                  }}
                  className={`h-11 rounded-xl border-slate-200 focus:ring-indigo-500 font-bold text-slate-800 ${errors.address ? 'border-rose-400 bg-rose-50/50' : ''}`}
                />
                {errors.address && <p className="text-[10px] text-rose-500 font-bold ml-1 uppercase">{errors.address}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Additional Details <span className="text-slate-300 lowercase font-normal italic">(Optional)</span>
                </Label>
                <Input 
                  placeholder="e.g. 25th Floor, Ocean Tower 2" 
                  value={formData.profile.addressDetail}
                  onChange={(e) => setFormData({
                    ...formData, 
                    profile: {...formData.profile, addressDetail: e.target.value}
                  })}
                  className="h-11 rounded-xl border-slate-200 focus:ring-indigo-500 font-bold text-slate-800"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 flex flex-col">
          <Card className="flex-1 border-none shadow-sm ring-1 ring-slate-100 bg-white overflow-hidden rounded-2xl">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-amber-600" />
                Branding & Online
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Website <span className="text-slate-300 lowercase font-normal italic">(Optional)</span></Label>
                <div className="relative group">
                  <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-300 transition-colors" />
                  <Input 
                    className="pl-10 h-10 rounded-xl border-slate-200 focus:ring-indigo-500 font-bold text-slate-800"
                    placeholder="https://www.brand.com"
                    value={formData.profile.website}
                    onChange={(e) => setFormData({
                      ...formData, 
                      profile: {...formData.profile, website: e.target.value}
                    })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logo URL <span className="text-slate-300 lowercase font-normal italic">(Optional)</span></Label>
                <div className="relative group">
                  <Store className="absolute left-3 top-3 w-4 h-4 text-slate-300 transition-colors" />
                  <Input 
                    className="pl-10 h-10 rounded-xl border-slate-200 focus:ring-indigo-500 font-bold text-slate-800"
                    placeholder="https://img.brand.com/logo.png"
                    value={formData.profile.logoUrl}
                    onChange={(e) => setFormData({
                      ...formData, 
                      profile: {...formData.profile, logoUrl: e.target.value}
                    })}
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
