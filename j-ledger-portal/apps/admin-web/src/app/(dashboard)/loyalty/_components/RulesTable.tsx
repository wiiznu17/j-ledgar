'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, Save, X, Edit2, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { loyaltyRequester } from '@/lib/requesters';

interface Rule {
  eventType: string;
  pointsPerThb: number;
  minAmount: number;
  maxPoints: number | null;
  isActive: boolean;
  isLocked: boolean;
  description: string;
}

interface RulesTableProps {
  rules: Rule[];
  onRefresh: () => void;
}

export function RulesTable({ rules, onRefresh }: RulesTableProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Rule | null>(null);
  const [loading, setLoading] = useState(false);

  const startEditing = (rule: Rule) => {
    if (rule.isLocked) {
      toast.error('Rule is locked. Unlock first to edit.');
      return;
    }
    setEditingKey(rule.eventType);
    setEditForm({ ...rule });
  };

  const cancelEditing = () => {
    setEditingKey(null);
    setEditForm(null);
  };

  const handleToggleLock = async (rule: Rule) => {
    try {
      setLoading(true);
      await loyaltyRequester.updateRule(rule.eventType, { isLocked: !rule.isLocked });
      toast.success(`${rule.eventType} is now ${!rule.isLocked ? 'Locked' : 'Unlocked'}`);
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update rule status');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (rule: Rule) => {
    if (rule.isLocked) {
      toast.error('Unlock the rule first to change its active status.');
      return;
    }
    try {
      setLoading(true);
      await loyaltyRequester.updateRule(rule.eventType, { isActive: !rule.isActive });
      toast.success(`${rule.eventType} is now ${!rule.isActive ? 'Active' : 'Inactive'}`);
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update active status');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editForm) return;
    try {
      setLoading(true);
      await loyaltyRequester.updateRule(editForm.eventType, {
        pointsPerThb: Number(editForm.pointsPerThb),
        minAmount: Number(editForm.minAmount),
        maxPoints: editForm.maxPoints ? Number(editForm.maxPoints) : null,
        description: editForm.description,
      });
      toast.success('Rule updated successfully');
      setEditingKey(null);
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-100 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50">
            <TableHead className="font-bold">Event Type</TableHead>
            <TableHead className="font-bold">Points / THB</TableHead>
            <TableHead className="font-bold">Min Amount</TableHead>
            <TableHead className="font-bold">Max Points</TableHead>
            <TableHead className="font-bold">Status</TableHead>
            <TableHead className="font-bold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule) => {
            const isEditing = editingKey === rule.eventType;
            
            return (
              <TableRow key={rule.eventType} className="hover:bg-slate-50/30 transition-colors">
                <TableCell>
                  <div className="font-bold text-slate-900">{rule.eventType}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{rule.description}</div>
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      className="w-24 h-8"
                      value={editForm?.pointsPerThb || 0}
                      onChange={(e) => setEditForm(f => f ? {...f, pointsPerThb: parseFloat(e.target.value)} : null)}
                    />
                  ) : (
                    <span className="font-medium">{rule.pointsPerThb}</span>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="number"
                      className="w-24 h-8"
                      value={editForm?.minAmount || 0}
                      onChange={(e) => setEditForm(f => f ? {...f, minAmount: parseFloat(e.target.value)} : null)}
                    />
                  ) : (
                    <span className="font-medium text-slate-600">{rule.minAmount} THB</span>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="number"
                      className="w-24 h-8"
                      value={editForm?.maxPoints || ''}
                      placeholder="No limit"
                      onChange={(e) => setEditForm(f => f ? {...f, maxPoints: e.target.value ? parseInt(e.target.value) : null} : null)}
                    />
                  ) : (
                    <span className="font-medium text-slate-600">{rule.maxPoints || 'Unlimited'}</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={rule.isActive ? 'default' : 'secondary'} className={rule.isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : ''}>
                      {rule.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                    <Badge variant={rule.isLocked ? 'outline' : 'secondary'} className={rule.isLocked ? 'border-amber-200 text-amber-700 bg-amber-50' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                      {rule.isLocked ? 'LOCKED' : 'EDITABLE'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {isEditing ? (
                      <>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-emerald-600" onClick={handleSave} disabled={loading}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400" onClick={cancelEditing} disabled={loading}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600" 
                          onClick={() => startEditing(rule)}
                          disabled={rule.isLocked || loading}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className={`h-8 w-8 p-0 ${rule.isActive ? 'text-amber-500' : 'text-emerald-500'}`}
                          onClick={() => handleToggleActive(rule)}
                          disabled={rule.isLocked || loading}
                          title={rule.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {rule.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className={`h-8 w-8 p-0 ${rule.isLocked ? 'text-blue-500' : 'text-amber-600'}`}
                          onClick={() => handleToggleLock(rule)}
                          disabled={loading}
                          title={rule.isLocked ? 'Unlock (Maintenance Mode)' : 'Lock (Production Mode)'}
                        >
                          {rule.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
