'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { adminApi } from '@/lib/admin-api';
import {
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  ShieldCheck,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { FraudRuleType, FraudRuleAction } from '@repo/dto';

export default function FraudRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ruleType: FraudRuleType.AMOUNT,
    action: FraudRuleAction.FLAG,
    severity: 'MEDIUM',
    isActive: true,
    condition: {
      maxAmount: 0,
      windowMinutes: 0,
      maxCount: 0,
    },
  });

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.fraudRules.findAll();
      setRules(response.data || []);
    } catch (error) {
      console.error('[FRAUD_RULES] Fetch error:', error);
      toast.error('Failed to load fraud rules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      description: '',
      ruleType: FraudRuleType.AMOUNT,
      action: FraudRuleAction.FLAG,
      severity: 'MEDIUM',
      isActive: true,
      condition: {
        maxAmount: 10000,
        windowMinutes: 60,
        maxCount: 5,
      },
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: any) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      ruleType: rule.ruleType,
      action: rule.action,
      severity: rule.severity,
      isActive: rule.isActive,
      condition: rule.condition || {
        maxAmount: 10000,
        windowMinutes: 60,
        maxCount: 5,
      },
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingRule) {
        await adminApi.fraudRules.update(editingRule.id, formData);
        toast.success('Fraud rule updated successfully');
      } else {
        await adminApi.fraudRules.create(formData);
        toast.success('Fraud rule created successfully');
      }
      setIsModalOpen(false);
      fetchRules();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save rule');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    try {
      await adminApi.fraudRules.remove(id);
      toast.success('Rule deleted');
      fetchRules();
    } catch (error) {
      toast.error('Failed to delete rule');
    }
  };

  const handleToggleActive = async (rule: any) => {
    try {
      await adminApi.fraudRules.update(rule.id, { isActive: !rule.isActive });
      toast.success(`Rule ${!rule.isActive ? 'activated' : 'deactivated'}`);
      fetchRules();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6 pb-10 text-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <SlidersHorizontal className="w-6 h-6 text-indigo-500" />
            Fraud Rules Engine
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure dynamic parameters to detect and prevent suspicious transactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchRules}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Rule
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Rules Configuration</CardTitle>
          <CardDescription>
            These rules are evaluated in real-time during transaction processing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Rule Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">Loading rules...</TableCell>
                </TableRow>
              ) : rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No fraud rules configured. Click "Create Rule" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => handleToggleActive(rule)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-bold">{rule.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate w-40">
                        {rule.description || 'No description'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {rule.ruleType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {JSON.stringify(rule.condition)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          rule.action === 'BLOCK'
                            ? 'bg-rose-500'
                            : rule.action === 'HOLD'
                            ? 'bg-amber-500'
                            : 'bg-indigo-500'
                        }
                      >
                        {rule.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-bold">{rule.severity}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(rule)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(rule.id)}
                          className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Edit Fraud Rule' : 'Create New Fraud Rule'}</DialogTitle>
              <DialogDescription>
                Define conditions and actions for this fraud detection rule.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Rule Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., High Amount Transfer Block"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explain what this rule detects..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Rule Type</Label>
                  <Select
                    value={formData.ruleType}
                    onValueChange={(v) => setFormData({ ...formData, ruleType: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FraudRuleType.AMOUNT}>Amount Threshold</SelectItem>
                      <SelectItem value={FraudRuleType.VELOCITY}>Velocity Check</SelectItem>
                      <SelectItem value={FraudRuleType.LOCATION}>Location Mismatch</SelectItem>
                      <SelectItem value={FraudRuleType.NEW_DEVICE}>New Device Login</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Enforcement Action</Label>
                  <Select
                    value={formData.action}
                    onValueChange={(v) => setFormData({ ...formData, action: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FraudRuleAction.FLAG}>Flag (Monitor Only)</SelectItem>
                      <SelectItem value={FraudRuleAction.HOLD}>Hold (Maker Approval)</SelectItem>
                      <SelectItem value={FraudRuleAction.BLOCK}>Block (Immediate)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-xl space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Condition Parameters (JSON)
                </Label>
                {formData.ruleType === FraudRuleType.AMOUNT && (
                  <div className="grid gap-2">
                    <Label htmlFor="maxAmount" className="text-xs">Max Transaction Amount (THB)</Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      value={formData.condition.maxAmount}
                      onChange={(e) => setFormData({
                        ...formData,
                        condition: { ...formData.condition, maxAmount: Number(e.target.value) }
                      })}
                    />
                  </div>
                )}
                {formData.ruleType === FraudRuleType.VELOCITY && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-1">
                      <Label className="text-xs">Window (Minutes)</Label>
                      <Input
                        type="number"
                        value={formData.condition.windowMinutes}
                        onChange={(e) => setFormData({
                          ...formData,
                          condition: { ...formData.condition, windowMinutes: Number(e.target.value) }
                        })}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs">Max Txn Count</Label>
                      <Input
                        type="number"
                        value={formData.condition.maxCount}
                        onChange={(e) => setFormData({
                          ...formData,
                          condition: { ...formData.condition, maxCount: Number(e.target.value) }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {editingRule ? 'Update Rule' : 'Create Rule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
