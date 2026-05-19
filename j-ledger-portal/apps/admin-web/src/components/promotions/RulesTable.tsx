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
      await loyaltyRequester.updateRule(rule.eventType, {
        isLocked: !rule.isLocked,
      });
      toast.success(
        `${rule.eventType} is now ${!rule.isLocked ? 'Locked' : 'Unlocked'}`,
      );
      onRefresh();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to update rule status',
      );
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
      await loyaltyRequester.updateRule(rule.eventType, {
        isActive: !rule.isActive,
      });
      toast.success(
        `${rule.eventType} is now ${!rule.isActive ? 'Active' : 'Inactive'}`,
      );
      onRefresh();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to update active status',
      );
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
    <div className="bg-card text-card-foreground rounded-xl border border-border shadow-xs overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="font-bold text-foreground">
              Event Type
            </TableHead>
            <TableHead className="font-bold text-foreground">
              Points / THB
            </TableHead>
            <TableHead className="font-bold text-foreground">
              Min Amount
            </TableHead>
            <TableHead className="font-bold text-foreground">
              Max Points
            </TableHead>
            <TableHead className="font-bold text-foreground">Status</TableHead>
            <TableHead className="font-bold text-right text-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule) => {
            const isEditing = editingKey === rule.eventType;

            return (
              <TableRow
                key={rule.eventType}
                className="hover:bg-muted/30 border-b border-border transition-colors"
              >
                <TableCell>
                  <div className="font-bold text-foreground">
                    {rule.eventType}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {rule.description}
                  </div>
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      className="w-24 h-8 bg-muted text-foreground border-border"
                      value={editForm?.pointsPerThb || 0}
                      onChange={(e) =>
                        setEditForm((f) =>
                          f
                            ? { ...f, pointsPerThb: parseFloat(e.target.value) }
                            : null,
                        )
                      }
                    />
                  ) : (
                    <span className="font-medium text-foreground">
                      {rule.pointsPerThb}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="number"
                      className="w-24 h-8 bg-muted text-foreground border-border"
                      value={editForm?.minAmount || 0}
                      onChange={(e) =>
                        setEditForm((f) =>
                          f
                            ? { ...f, minAmount: parseFloat(e.target.value) }
                            : null,
                        )
                      }
                    />
                  ) : (
                    <span className="font-medium text-muted-foreground">
                      {rule.minAmount} THB
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="number"
                      className="w-24 h-8 bg-muted text-foreground border-border"
                      value={editForm?.maxPoints || ''}
                      placeholder="No limit"
                      onChange={(e) =>
                        setEditForm((f) =>
                          f
                            ? {
                                ...f,
                                maxPoints: e.target.value
                                  ? parseInt(e.target.value)
                                  : null,
                              }
                            : null,
                        )
                      }
                    />
                  ) : (
                    <span className="font-medium text-muted-foreground">
                      {rule.maxPoints || 'Unlimited'}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={rule.isActive ? 'default' : 'secondary'}
                      className={
                        rule.isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-muted text-muted-foreground border-border'
                      }
                    >
                      {rule.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                    <Badge
                      variant={rule.isLocked ? 'outline' : 'secondary'}
                      className={
                        rule.isLocked
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }
                    >
                      {rule.isLocked ? 'LOCKED' : 'EDITABLE'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-emerald-600 dark:text-emerald-400"
                          onClick={handleSave}
                          disabled={loading}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground"
                          onClick={cancelEditing}
                          disabled={loading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400"
                          onClick={() => startEditing(rule)}
                          disabled={rule.isLocked || loading}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-8 w-8 p-0 ${rule.isActive ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                          onClick={() => handleToggleActive(rule)}
                          disabled={rule.isLocked || loading}
                          title={rule.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {rule.isActive ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-8 w-8 p-0 ${rule.isLocked ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}
                          onClick={() => handleToggleLock(rule)}
                          disabled={loading}
                          title={
                            rule.isLocked
                              ? 'Unlock (Maintenance Mode)'
                              : 'Lock (Production Mode)'
                          }
                        >
                          {rule.isLocked ? (
                            <Unlock className="h-4 w-4" />
                          ) : (
                            <Lock className="h-4 w-4" />
                          )}
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
