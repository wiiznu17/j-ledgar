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
import { promotionsRequester, merchantRequester } from '@/lib/requesters';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SectionHeader = ({ icon: Icon, title, colorClass }: { icon: any, title: string, colorClass: string }) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${colorClass} mb-4`}>
    <Icon size={14} className="opacity-70" />
    <h3 className="text-[10px] font-black uppercase tracking-widest">{title}</h3>
  </div>
);

const CharCounter = ({ current, max }: { current: number, max: number }) => (
  <div className={`text-[8px] font-bold text-right mt-0.5 ${current > max ? 'text-red-500' : 'text-muted-foreground/40'}`}>
    {current} / {max}
  </div>
);

interface BrandForm {
  name: string;
  description: string;
  website: string;
  logoUrl: string;
  partnerId: string;
}

export default function PromotionSettingsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dialog states
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form states
  const [brandForm, setBrandForm] = useState<BrandForm>({
    name: '',
    description: '',
    website: '',
    logoUrl: '',
    partnerId: 'none',
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
      const [b, c, p] = await Promise.all([
        promotionsRequester.getBrands(),
        promotionsRequester.getCategories(),
        merchantRequester.getPartners({ limit: 100, status: 'ACTIVE' }),
      ]);
      setBrands(b);
      setCategories(c);
      setPartners(p.data || []);
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
        partnerId: brand.partnerId || 'none',
      });
    } else {
      setEditingItem(null);
      setBrandForm({ name: '', description: '', website: '', logoUrl: '', partnerId: 'none' });
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

      // Convert 'none' back to null for API
      const submissionData = { 
        ...brandForm, 
        logoUrl: finalLogoUrl,
        partnerId: brandForm.partnerId === 'none' ? null : brandForm.partnerId 
      };

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
    <div className="space-y-6 pb-10 text-foreground">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Promotion Metadata
            </h2>
            <p className="text-muted-foreground mt-1">
            Configure system brands and deal categories used across the platform.
            </p>
        </div>
      </div>

      <Tabs defaultValue="brands" className="space-y-6">
        <TabsList className="bg-muted p-1 border border-border rounded-xl">
          <TabsTrigger value="brands" className="gap-2 px-6 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground">
            <Globe size={14} className="text-indigo-600 dark:text-indigo-400" /> <span className="font-bold text-xs uppercase tracking-tight">Brands</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2 px-6 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground">
            <Tag size={14} className="text-indigo-600 dark:text-indigo-400" /> <span className="font-bold text-xs uppercase tracking-tight">Categories</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="brands">
          <Card className="border border-border shadow-xs overflow-hidden bg-card text-card-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 bg-muted/30 border-b border-border">
              <div>
                <CardTitle className="text-lg font-bold">Partner Brands</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Manage the brand identities that partner with our rewards program.
                </CardDescription>
              </div>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-xs rounded-xl px-4 border-0" onClick={() => handleOpenBrandModal()}>
                <Plus className="mr-2 h-4 w-4" /> Add Brand
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow className="border-b border-border">
                      <TableHead className="px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Brand</TableHead>
                      <TableHead className="px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Partner</TableHead>
                      <TableHead className="px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Description</TableHead>
                      <TableHead className="px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Website</TableHead>
                      <TableHead className="px-6 text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border">
                    {brands.map((b) => (
                      <TableRow key={b.id} className="hover:bg-muted/40 transition-colors border-b border-border">
                        <TableCell className="px-6 py-4 font-medium">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl border border-border bg-card overflow-hidden flex-shrink-0 shadow-xs p-1">
                                  {b.logoUrl ? (
                                      <img src={b.logoUrl} className="w-full h-full object-contain" />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground/30">LOGO</div>
                                  )}
                              </div>
                              <span className="font-bold text-foreground">{b.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                           {b.partner ? (
                             <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-bold px-2 py-0.5 rounded-lg text-[9px]">
                               {b.partner.name}
                             </Badge>
                           ) : (
                             <span className="text-[10px] text-muted-foreground/30 font-bold italic">NO PARTNER</span>
                           )}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-xs text-muted-foreground max-w-[300px] leading-relaxed">
                          {b.description || '-'}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          {b.website ? (
                            <a
                              href={b.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 text-[10px] font-bold hover:underline bg-indigo-500/10 px-2.5 py-1 rounded-full w-fit"
                            >
                              {new URL(b.website).hostname} <ExternalLink size={10} />
                            </a>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-500/10 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/20 rounded-xl transition-all" onClick={() => handleOpenBrandModal(b)}>
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
          <Card className="border border-border shadow-xs overflow-hidden bg-card text-card-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 bg-muted/30 border-b border-border">
              <div>
                <CardTitle className="text-lg font-bold">Deal Categories</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Group deals into meaningful sections for user navigation.
                </CardDescription>
              </div>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-xs rounded-xl px-4 border-0" onClick={() => handleOpenCategoryModal()}>
                <Plus className="mr-2 h-4 w-4" /> Add Category
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow className="border-b border-border">
                      <TableHead className="px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Category</TableHead>
                      <TableHead className="px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Order</TableHead>
                      <TableHead className="px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Description</TableHead>
                      <TableHead className="px-6 text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border">
                    {categories.map((c) => (
                      <TableRow key={c.id} className="hover:bg-muted/40 transition-colors border-b border-border">
                        <TableCell className="px-6 py-4 font-medium">
                          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-bold px-3 py-1 rounded-lg">
                              {c.name.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-black text-foreground tabular-nums border border-border">
                            {c.order}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-xs text-muted-foreground leading-relaxed">
                          {c.description || '-'}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-500/10 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/20 rounded-xl transition-all" onClick={() => handleOpenCategoryModal(c)}>
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
        <DialogContent className="sm:max-w-[800px] w-[95vw] p-0 overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl">
          <form onSubmit={handleBrandSubmit}>
            <div className="p-8 pb-4">
                <DialogHeader>
                <DialogTitle className="text-2xl font-black text-foreground">{editingItem ? 'Edit Brand' : 'Add New Brand'}</DialogTitle>
                <DialogDescription className="text-muted-foreground font-medium">
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
                    <SectionHeader icon={Info} title="Basic Details" colorClass="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" />
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="b-name" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Brand Name</Label>
                                <Input id="b-name" maxLength={100} value={brandForm.name} onChange={(e) => setBrandForm({...brandForm, name: e.target.value})} placeholder="e.g. Starbucks" required className="rounded-xl bg-card text-foreground border-border focus:ring-indigo-500" />
                                <CharCounter current={brandForm.name.length} max={100} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="b-partner" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Associated Partner</Label>
                                <Select value={brandForm.partnerId} onValueChange={(val: string | null) => setBrandForm(prev => ({...prev, partnerId: val || 'none'}))}>
                                    <SelectTrigger id="b-partner" className="rounded-xl bg-card text-foreground border-border focus:ring-indigo-500">
                                        <SelectValue placeholder="Select Partner" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl bg-card text-foreground border-border shadow-xl">
                                        <SelectItem value="none" className="text-muted-foreground/60 italic">None (Independent Brand)</SelectItem>
                                        {partners.map(p => (
                                            <SelectItem key={p.id} value={p.id || ''}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="b-web" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Website URL</Label>
                            <div className="relative">
                                <Input id="b-web" maxLength={255} value={brandForm.website} onChange={(e) => setBrandForm({...brandForm, website: e.target.value})} placeholder="https://..." className="rounded-xl bg-card text-foreground border-border pl-10 focus:ring-indigo-500" />
                                <LinkIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                            </div>
                            <CharCounter current={brandForm.website.length} max={255} />
                        </div>
                    </div>
                </div>

                <div>
                    <SectionHeader icon={Layers} title="Additional Info" colorClass="bg-muted text-muted-foreground" />
                    <div className="space-y-2">
                        <Label htmlFor="b-desc" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Description</Label>
                        <Textarea id="b-desc" rows={3} maxLength={500} value={brandForm.description} onChange={(e) => setBrandForm({...brandForm, description: e.target.value})} placeholder="Brief info about the brand" className="rounded-xl bg-card text-foreground border-border resize-none focus:ring-indigo-500" />
                        <CharCounter current={brandForm.description.length} max={500} />
                    </div>
                </div>
              </div>
            </div>

            <div className="p-8 pt-4 bg-muted/30 border-t border-border">
                <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsBrandModalOpen(false)} className="rounded-xl font-bold text-muted-foreground hover:text-foreground hover:bg-muted">Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl px-8 font-bold shadow-xs transition-all active:scale-95 border-0" disabled={submitting}>
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
        <DialogContent className="sm:max-w-[600px] w-[95vw] p-0 overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl">
          <form onSubmit={handleCategorySubmit}>
            <div className="p-8 pb-4">
                <DialogHeader>
                <DialogTitle className="text-2xl font-black text-foreground">{editingItem ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                <DialogDescription className="text-muted-foreground font-medium">
                    Group deals into categories to help users find rewards.
                </DialogDescription>
                </DialogHeader>
            </div>

            <div className="p-8 pt-2 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="c-name" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Category Name</Label>
                    <Input id="c-name" maxLength={100} value={categoryForm.name} onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})} placeholder="e.g. Food & Beverage" required className="rounded-xl bg-card text-foreground border-border focus:ring-indigo-500 font-bold" />
                    <CharCounter current={categoryForm.name.length} max={100} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="c-order" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Display Order</Label>
                    <Input id="c-order" type="number" min={0} value={categoryForm.order} onChange={(e) => setCategoryForm({...categoryForm, order: parseInt(e.target.value)})} className="rounded-xl bg-card text-foreground border-border focus:ring-indigo-500" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="c-desc" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Description</Label>
                <Textarea id="c-desc" rows={3} maxLength={500} value={categoryForm.description} onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})} placeholder="Describe what this category covers" className="rounded-xl bg-card text-foreground border-border resize-none focus:ring-indigo-500" />
                <CharCounter current={categoryForm.description.length} max={500} />
              </div>
            </div>

            <div className="p-8 pt-4 bg-muted/30 border-t border-border">
                <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsCategoryModalOpen(false)} className="rounded-xl font-bold text-muted-foreground hover:text-foreground hover:bg-muted">Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl px-8 font-bold shadow-xs transition-all active:scale-95 border-0" disabled={submitting}>
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
