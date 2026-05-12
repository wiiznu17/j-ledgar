'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Globe, Tag, ExternalLink, Edit2, X, Info, Link as LinkIcon, Layers } from 'lucide-react';
import { promotionsRequester } from '@/lib/requesters';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
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
import { ImageUploadWithCrop } from '@/components/promotions/ImageUploadWithCrop';

const SectionHeader = ({ icon: Icon, title, colorClass }: { icon: any, title: string, colorClass: string }) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${colorClass} mb-4`}>
    <Icon size={14} className="opacity-70" />
    <h3 className="text-[10px] font-black uppercase tracking-widest">{title}</h3>
  </div>
);

const CharCounter = ({ current, max }: { current: number, max: number }) => (
  <div className={`text-[8px] font-bold text-right mt-0.5 ${current > max ? 'text-red-500' : 'text-slate-300'}`}>
    {current} / {max}
  </div>
);

export default function PromotionSettingsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dialog states
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form states
  const [brandForm, setBrandForm] = useState({
    name: '',
    description: '',
    website: '',
    logoUrl: '',
  });
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    iconUrl: '',
    order: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [b, c] = await Promise.all([
        promotionsRequester.getBrands(),
        promotionsRequester.getCategories(),
      ]);
      setBrands(b);
      setCategories(c);
    } catch (error) {
      toast.error('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenBrandModal = (brand: any = null) => {
    setBrandLogoFile(null); // Reset file
    if (brand) {
      setEditingItem(brand);
      setBrandForm({
        name: brand.name,
        description: brand.description || '',
        website: brand.website || '',
        logoUrl: brand.logoUrl || '',
      });
    } else {
      setEditingItem(null);
      setBrandForm({ name: '', description: '', website: '', logoUrl: '' });
    }
    setIsBrandModalOpen(true);
  };

  const handleOpenCategoryModal = (category: any = null) => {
    if (category) {
      setEditingItem(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        iconUrl: category.iconUrl || '',
        order: category.order || 0,
      });
    } else {
      setEditingItem(null);
      setCategoryForm({ name: '', description: '', iconUrl: '', order: 0 });
    }
    setIsCategoryModalOpen(true);
  };

  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let finalLogoUrl = brandForm.logoUrl;
      
      // Upload if new file selected
      if (brandLogoFile) {
        const { url } = await promotionsRequester.uploadFile(brandLogoFile);
        finalLogoUrl = url;
      }

      const submissionData = { ...brandForm, logoUrl: finalLogoUrl };

      if (editingItem) {
        await promotionsRequester.updateBrand(editingItem.id, submissionData);
        toast.success('Brand updated successfully');
      } else {
        await promotionsRequester.createBrand(submissionData);
        toast.success('Brand created successfully');
      }
      setIsBrandModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to save brand');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingItem) {
        await promotionsRequester.updateCategory(editingItem.id, categoryForm);
        toast.success('Category updated successfully');
      } else {
        await promotionsRequester.createCategory(categoryForm);
        toast.success('Category created successfully');
      }
      setIsCategoryModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Promotion Metadata
            </h2>
            <p className="text-slate-500 mt-1">
            Configure system brands and deal categories used across the platform.
            </p>
        </div>
      </div>

      <Tabs defaultValue="brands" className="space-y-6">
        <TabsList className="bg-slate-100/80 p-1 border border-slate-200 rounded-xl">
          <TabsTrigger value="brands" className="gap-2 px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Globe size={14} className="text-blue-500" /> <span className="font-bold text-xs uppercase tracking-tight">Brands</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2 px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Tag size={14} className="text-purple-500" /> <span className="font-bold text-xs uppercase tracking-tight">Categories</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="brands">
          <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 bg-slate-50/50">
              <div>
                <CardTitle className="text-lg font-bold">Partner Brands</CardTitle>
                <CardDescription>
                  Manage the brand identities that partner with our rewards program.
                </CardDescription>
              </div>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 rounded-xl px-4" onClick={() => handleOpenBrandModal()}>
                <Plus className="mr-2 h-4 w-4" /> Add Brand
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-300" />
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50/30">
                    <TableRow className="border-b border-slate-100">
                      <TableHead className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand</TableHead>
                      <TableHead className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</TableHead>
                      <TableHead className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Website</TableHead>
                      <TableHead className="px-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-50">
                    {brands.map((b) => (
                      <TableRow key={b.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="px-6 py-4 font-medium">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl border border-slate-100 bg-white overflow-hidden flex-shrink-0 shadow-sm p-1">
                                  {b.logoUrl ? (
                                      <img src={b.logoUrl} className="w-full h-full object-contain" />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-300">LOGO</div>
                                  )}
                              </div>
                              <span className="font-bold text-slate-700">{b.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-xs text-slate-500 max-w-[300px] leading-relaxed">
                          {b.description || '-'}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          {b.website ? (
                            <a
                              href={b.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-500 flex items-center gap-1.5 text-[10px] font-bold hover:underline bg-blue-50 px-2 py-1 rounded-full w-fit"
                            >
                              {new URL(b.website).hostname} <ExternalLink size={10} />
                            </a>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" onClick={() => handleOpenBrandModal(b)}>
                              <Edit2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 bg-slate-50/50">
              <div>
                <CardTitle className="text-lg font-bold">Deal Categories</CardTitle>
                <CardDescription>
                  Group deals into meaningful sections for user navigation.
                </CardDescription>
              </div>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-100 rounded-xl px-4" onClick={() => handleOpenCategoryModal()}>
                <Plus className="mr-2 h-4 w-4" /> Add Category
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-300" />
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50/30">
                    <TableRow className="border-b border-slate-100">
                      <TableHead className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</TableHead>
                      <TableHead className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order</TableHead>
                      <TableHead className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</TableHead>
                      <TableHead className="px-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-50">
                    {categories.map((c) => (
                      <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="px-6 py-4 font-medium">
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-100 font-bold px-3 py-1 rounded-lg">
                              {c.name.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 tabular-nums border border-slate-200">
                            {c.order}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-xs text-slate-500 leading-relaxed">
                          {c.description || '-'}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all" onClick={() => handleOpenCategoryModal(c)}>
                              <Edit2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Brand Modal */}
      <Dialog open={isBrandModalOpen} onOpenChange={setIsBrandModalOpen}>
        <DialogContent className="sm:max-w-[800px] w-[95vw] p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
          <form onSubmit={handleBrandSubmit}>
            <div className="p-8 pb-4">
                <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-800">{editingItem ? 'Edit Brand' : 'Add New Brand'}</DialogTitle>
                <DialogDescription className="text-slate-500 font-medium">
                    Configure the identity of a partner merchant or brand.
                </DialogDescription>
                </DialogHeader>
            </div>

            <div className="p-8 pt-2 grid grid-cols-1 md:grid-cols-5 gap-8">
              <div className="md:col-span-2">
                <ImageUploadWithCrop 
                    label="Brand Logo" 
                    value={brandForm.logoUrl} 
                    onChange={(url, file) => {
                        setBrandForm({...brandForm, logoUrl: url});
                        if (file) setBrandLogoFile(file);
                        else setBrandLogoFile(null);
                    }}
                    aspect={1}
                    maxSizeMB={1}
                />
              </div>
              <div className="md:col-span-3 space-y-6">
                <div>
                    <SectionHeader icon={Info} title="Basic Details" colorClass="bg-blue-50 text-blue-700" />
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="b-name" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand Name</Label>
                            <Input id="b-name" maxLength={100} value={brandForm.name} onChange={(e) => setBrandForm({...brandForm, name: e.target.value})} placeholder="e.g. Starbucks" required className="rounded-xl border-slate-200 focus:ring-blue-500" />
                            <CharCounter current={brandForm.name.length} max={100} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="b-web" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Website URL</Label>
                            <div className="relative">
                                <Input id="b-web" maxLength={255} value={brandForm.website} onChange={(e) => setBrandForm({...brandForm, website: e.target.value})} placeholder="https://..." className="rounded-xl border-slate-200 pl-10 focus:ring-blue-500" />
                                <LinkIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                            </div>
                            <CharCounter current={brandForm.website.length} max={255} />
                        </div>
                    </div>
                </div>

                <div>
                    <SectionHeader icon={Layers} title="Additional Info" colorClass="bg-slate-100 text-slate-700" />
                    <div className="space-y-2">
                        <Label htmlFor="b-desc" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</Label>
                        <Textarea id="b-desc" rows={3} maxLength={500} value={brandForm.description} onChange={(e) => setBrandForm({...brandForm, description: e.target.value})} placeholder="Brief info about the brand" className="rounded-xl border-slate-200 resize-none" />
                        <CharCounter current={brandForm.description.length} max={500} />
                    </div>
                </div>
              </div>
            </div>

            <div className="p-8 pt-4 bg-slate-50 border-t border-slate-100">
                <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsBrandModalOpen(false)} className="rounded-xl font-bold text-slate-400">Cancel</Button>
                <Button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-8 font-bold shadow-lg shadow-blue-100 transition-all active:scale-95" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingItem ? 'Save Changes' : 'Create Brand'}
                </Button>
                </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="sm:max-w-[600px] w-[95vw] p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
          <form onSubmit={handleCategorySubmit}>
            <div className="p-8 pb-4">
                <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-800">{editingItem ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                <DialogDescription className="text-slate-500 font-medium">
                    Group deals into categories to help users find rewards.
                </DialogDescription>
                </DialogHeader>
            </div>

            <div className="p-8 pt-2 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="c-name" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category Name</Label>
                    <Input id="c-name" maxLength={100} value={categoryForm.name} onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})} placeholder="e.g. Food & Beverage" required className="rounded-xl border-slate-200 focus:ring-purple-500 font-bold" />
                    <CharCounter current={categoryForm.name.length} max={100} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="c-order" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Order</Label>
                    <Input id="c-order" type="number" min={0} value={categoryForm.order} onChange={(e) => setCategoryForm({...categoryForm, order: parseInt(e.target.value)})} className="rounded-xl border-slate-200" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="c-desc" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</Label>
                <Textarea id="c-desc" rows={3} maxLength={500} value={categoryForm.description} onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})} placeholder="Describe what this category covers" className="rounded-xl border-slate-200 resize-none" />
                <CharCounter current={categoryForm.description.length} max={500} />
              </div>
            </div>

            <div className="p-8 pt-4 bg-slate-50 border-t border-slate-100">
                <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsCategoryModalOpen(false)} className="rounded-xl font-bold text-slate-400">Cancel</Button>
                <Button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl px-8 font-bold shadow-lg shadow-purple-200 transition-all active:scale-95" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingItem ? 'Save Changes' : 'Create Category'}
                </Button>
                </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
