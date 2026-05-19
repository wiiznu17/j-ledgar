'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { promotionsRequester } from '@/lib/requesters';
import { toast } from 'sonner';
import {
  Loader2,
  Info,
  Tag,
  ShoppingBag,
  Settings2,
  Image as ImageIcon,
  Scale,
} from 'lucide-react';
import { ImageUploadWithCrop } from '@/components/promotions/ImageUploadWithCrop';
import { FilterDatePicker } from '@/components/common/FilterElements';

interface DealFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
  isPage?: boolean;
}

const SectionHeader = ({
  icon: Icon,
  title,
  colorClass,
}: {
  icon: any;
  title: string;
  colorClass: string;
}) => (
  <div
    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${colorClass} mb-3`}
  >
    <Icon size={14} className="opacity-70" />
    <h3 className="text-[10px] font-bold uppercase tracking-widest">{title}</h3>
  </div>
);

const CharCounter = ({ current, max }: { current: number; max: number }) => (
  <div
    className={`text-[9px] font-bold text-right mt-1 ${current > max ? 'text-destructive' : 'text-muted-foreground'}`}
  >
    {current.toLocaleString()} / {max.toLocaleString()}
  </div>
);

export function DealForm({
  initialData,
  onSuccess,
  onCancel,
  isPage = false,
}: DealFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    pointsRequired: initialData?.pointsRequired || 0,
    stock: initialData?.stock || 0,
    imageUrl: initialData?.imageUrl || '',
    brandId: initialData?.brandId || '',
    categoryId: initialData?.categoryId || '',
    priority: initialData?.priority || 0,
    termsCondition: initialData?.termsCondition || '',
    limitPerUser: initialData?.limitPerUser || 0,
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    startDate: initialData?.startDate
      ? new Date(initialData.startDate).toISOString().split('T')[0]
      : '',
    endDate: initialData?.endDate
      ? new Date(initialData.endDate).toISOString().split('T')[0]
      : '',
  });

  const fetchMeta = async () => {
    try {
      const [b, c] = await Promise.all([
        promotionsRequester.getBrands(),
        promotionsRequester.getCategories(),
      ]);
      setBrands(b);
      setCategories(c);
    } catch (error) {
      toast.error('Failed to load metadata');
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  // -- Unsaved Changes Warning --
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue =
          'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.brandId || !formData.categoryId) {
      toast.error('Please select both Brand and Category');
      return;
    }

    if (
      formData.startDate &&
      formData.endDate &&
      new Date(formData.startDate) > new Date(formData.endDate)
    ) {
      toast.error('End Date cannot be earlier than Start Date');
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = formData.imageUrl;
      if (imageFile) {
        const { url } = await promotionsRequester.uploadFile(imageFile);
        finalImageUrl = url;
      }

      const submissionData = {
        ...formData,
        imageUrl: finalImageUrl,
        limitPerUser: formData.limitPerUser || 1, // Fallback to 1 if empty
      };

      if (initialData?.id) {
        await promotionsRequester.updateDeal(initialData.id, submissionData);
        toast.success('Deal updated successfully');
      } else {
        await promotionsRequester.createDeal(submissionData);
        toast.success('Deal created successfully');
      }

      setIsDirty(false); // Reset dirty state after successful save

      if (onSuccess) onSuccess();
      else if (isPage) {
        router.push('/promotions/deals');
        router.refresh();
      }
    } catch (error) {
      toast.error('Failed to save deal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 text-foreground bg-card"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (WIDER: 7/12) */}
        <div className="lg:col-span-7 space-y-6 flex flex-col h-full">
          <div className="bg-card p-5 rounded-[1.5rem] border border-border shadow-xs flex-1">
            <SectionHeader
              icon={ImageIcon}
              title="Deal Media"
              colorClass="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
            />
            <ImageUploadWithCrop
              label="Cover Banner"
              value={formData.imageUrl}
              onChange={(url, file) => {
                setFormData({ ...formData, imageUrl: url });
                setIsDirty(true);
                if (file) setImageFile(file);
                else setImageFile(null);
              }}
              aspect={16 / 9}
              maxSizeMB={2}
            />
          </div>

          <div className="bg-card p-5 rounded-[1.5rem] border border-border shadow-xs">
            <SectionHeader
              icon={ShoppingBag}
              title="Logistics & Rules"
              colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="points"
                  className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1"
                >
                  Points
                </Label>
                <div className="relative">
                  <Input
                    id="points"
                    type="text"
                    inputMode="numeric"
                    value={formData.pointsRequired || ''}
                    disabled={!!initialData?.id}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      const numVal = parseInt(val);
                      setFormData({
                        ...formData,
                        pointsRequired: isNaN(numVal) ? 0 : numVal,
                      });
                      setIsDirty(true);
                    }}
                    placeholder="e.g. 500"
                    required
                    className={`rounded-xl border-border pl-8 h-10 font-bold ${!!initialData?.id ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10'} placeholder:font-medium placeholder:text-muted-foreground/50`}
                  />
                  <Tag
                    size={12}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="stock"
                  className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1"
                >
                  Stock
                </Label>
                <Input
                  id="stock"
                  type="text"
                  inputMode="numeric"
                  value={formData.stock || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    const numVal = parseInt(val);
                    setFormData({
                      ...formData,
                      stock: isNaN(numVal) ? 0 : numVal,
                    });
                    setIsDirty(true);
                  }}
                  placeholder="e.g. 100"
                  required
                  className="rounded-xl border-border bg-muted text-foreground h-10 text-center font-bold placeholder:font-medium placeholder:text-muted-foreground/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="limit"
                  className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1"
                >
                  Limit Per User
                </Label>
                <Input
                  id="limit"
                  type="text"
                  inputMode="numeric"
                  value={formData.limitPerUser || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    const numVal = parseInt(val);
                    setFormData({
                      ...formData,
                      limitPerUser: isNaN(numVal) ? 1 : numVal,
                    });
                    setIsDirty(true);
                  }}
                  placeholder="e.g. 1"
                  required
                  className="rounded-xl border-border bg-muted text-foreground h-10 text-center font-bold placeholder:font-medium placeholder:text-muted-foreground/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5/12) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col h-full">
          <div className="bg-card p-5 rounded-[1.5rem] border border-border shadow-xs flex-1">
            <SectionHeader
              icon={Info}
              title="Promotion Content"
              colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            />
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="title"
                  className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1"
                >
                  Headline
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  maxLength={100}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    setIsDirty(true);
                  }}
                  placeholder="Catchy deal title"
                  required
                  className="rounded-xl border-border bg-muted text-foreground h-10 font-bold placeholder:font-medium placeholder:text-muted-foreground/50"
                />
                <CharCounter current={formData.title.length} max={100} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                    Brand
                  </Label>
                  <Select
                    value={formData.brandId || ''}
                    onValueChange={(val) => {
                      setFormData({ ...formData, brandId: val });
                      setIsDirty(true);
                    }}
                  >
                    <SelectTrigger className="rounded-xl border-border h-9 font-bold text-foreground bg-muted">
                      {formData.brandId && brands.length > 0 ? (
                        <span>
                          {brands.find((b) => b.id === formData.brandId)
                            ?.name || 'Select Brand'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {brands.length === 0 ? 'Loading...' : 'Select Brand'}
                        </span>
                      )}
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-card border-border">
                      {brands.map((b) => (
                        <SelectItem
                          key={b.id}
                          value={b.id}
                          className="font-bold py-1.5 text-foreground hover:bg-muted"
                        >
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                    Category
                  </Label>
                  <Select
                    value={formData.categoryId || ''}
                    onValueChange={(val) => {
                      setFormData({ ...formData, categoryId: val });
                      setIsDirty(true);
                    }}
                  >
                    <SelectTrigger className="rounded-xl border-border h-9 font-bold text-foreground bg-muted">
                      {formData.categoryId && categories.length > 0 ? (
                        <span>
                          {categories.find((c) => c.id === formData.categoryId)
                            ?.name || 'Select Category'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {categories.length === 0
                            ? 'Loading...'
                            : 'Select Category'}
                        </span>
                      )}
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-card border-border">
                      {categories.map((c) => (
                        <SelectItem
                          key={c.id}
                          value={c.id}
                          className="font-bold py-1.5 text-foreground hover:bg-muted"
                        >
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="description"
                  className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1"
                >
                  Summary
                </Label>
                <Input
                  id="description"
                  value={formData.description}
                  maxLength={500}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    setIsDirty(true);
                  }}
                  placeholder="Short summary for customers"
                  required
                  className="rounded-xl border-border bg-muted text-foreground h-10 font-bold placeholder:font-medium placeholder:text-muted-foreground/50"
                />
                <CharCounter current={formData.description.length} max={500} />
              </div>
            </div>
          </div>

          <div className="bg-card p-5 rounded-[1.5rem] border border-border shadow-xs">
            <SectionHeader
              icon={Settings2}
              title="Availability"
              colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400"
            />
            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between p-2 rounded-xl bg-muted border border-border">
                <div className="space-y-0.5">
                  <Label className="text-[10px] font-bold text-foreground">
                    Status
                  </Label>
                  <p className="text-[9px] text-muted-foreground uppercase font-black">
                    Active
                  </p>
                </div>
                <div
                  onClick={() => {
                    setFormData({ ...formData, isActive: !formData.isActive });
                    setIsDirty(true);
                  }}
                  className={`relative w-12 h-6 rounded-full cursor-pointer transition-all duration-300 shadow-inner ${
                    formData.isActive
                      ? 'bg-emerald-500'
                      : 'bg-muted border border-border'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-md transition-all duration-300 transform ${
                      formData.isActive ? 'translate-x-6' : 'translate-x-0'
                    } flex items-center justify-center`}
                  >
                    <div
                      className={`w-1 h-1 rounded-full ${formData.isActive ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}
                    />
                  </div>
                  <span
                    className={`absolute inset-0 flex items-center justify-center text-[8px] font-black pointer-events-none transition-all ${
                      formData.isActive
                        ? 'pr-5 text-white opacity-0'
                        : 'pl-5 text-muted-foreground opacity-100'
                    }`}
                  >
                    OFF
                  </span>
                  <span
                    className={`absolute inset-0 flex items-center justify-center text-[8px] font-black pointer-events-none transition-all ${
                      formData.isActive
                        ? 'pr-5 text-white opacity-100'
                        : 'pl-5 text-muted-foreground opacity-0'
                    }`}
                  >
                    ON
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FilterDatePicker
                  label="Start"
                  value={formData.startDate || ''}
                  onChange={(val: string) => {
                    const newFormData = { ...formData, startDate: val };
                    if (
                      val &&
                      formData.endDate &&
                      new Date(val) > new Date(formData.endDate)
                    ) {
                      newFormData.endDate = '';
                    }
                    setFormData(newFormData);
                    setIsDirty(true);
                  }}
                  placeholder="Immediate"
                />
                <FilterDatePicker
                  label="End"
                  value={formData.endDate || ''}
                  onChange={(val: string) => {
                    if (
                      val &&
                      formData.startDate &&
                      new Date(val) < new Date(formData.startDate)
                    ) {
                      toast.error('End Date cannot be earlier than Start Date');
                      return;
                    }
                    setFormData({ ...formData, endDate: val });
                    setIsDirty(true);
                  }}
                  placeholder="Never"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULL WIDTH BOTTOM: Legal & Fine Print */}
      <div className="bg-card p-5 rounded-[1.5rem] border border-border shadow-xs">
        <SectionHeader
          icon={Scale}
          title="Legal & Fine Print"
          colorClass="bg-muted text-muted-foreground"
        />
        <div className="flex flex-col">
          <Textarea
            id="terms"
            rows={3}
            maxLength={2000}
            value={formData.termsCondition}
            onChange={(e) => {
              setFormData({ ...formData, termsCondition: e.target.value });
              setIsDirty(true);
            }}
            placeholder="Usage rules, expiration terms, and legal disclaimers..."
            className="rounded-xl border-border bg-muted text-foreground p-4 resize-none text-xs"
          />
          <CharCounter current={formData.termsCondition.length} max={2000} />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <Button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-12 h-11 font-black shadow-xs transition-all active:scale-95"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? 'Save Changes' : 'Publish Deal'}
        </Button>
      </div>
    </form>
  );
}
