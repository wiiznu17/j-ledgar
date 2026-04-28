import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Receipt, CircleHelp, List } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

export type HistoryKind = 'TOPUP' | 'TRANSFER' | 'PAYMENT' | 'WITHDRAWAL';
export type HistoryStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
export type HistoryDirection = 'IN' | 'OUT';

export interface HistoryItem {
  id: string;
  kind: HistoryKind;
  title: string;
  subtitle?: string;
  amount: string;
  currency: string;
  direction: HistoryDirection;
  status: HistoryStatus;
  occurredAt: string;
  source: 'WALLET_TXN' | 'TOPUP_ORDER';
  provider?: string;
  paymentIntentId?: string;
  orderId?: string;
  reference?: string;
}

export interface HistoryFilter {
  key: 'ALL' | HistoryKind;
  label: string;
  icon: LucideIcon;
}

export const HISTORY_FILTERS: HistoryFilter[] = [
  { key: 'ALL', label: 'All', icon: List },
  { key: 'TOPUP', label: 'Top Up', icon: ArrowDownToLine },
  { key: 'TRANSFER', label: 'Transfer', icon: ArrowLeftRight },
  { key: 'PAYMENT', label: 'Payment', icon: Receipt },
  { key: 'WITHDRAWAL', label: 'Withdrawal', icon: ArrowUpFromLine },
];

export const KIND_META: Record<HistoryKind, { label: string; icon: LucideIcon }> = {
  TOPUP: { label: 'Top Up', icon: ArrowDownToLine },
  TRANSFER: { label: 'Transfer', icon: ArrowLeftRight },
  PAYMENT: { label: 'Payment', icon: Receipt },
  WITHDRAWAL: { label: 'Withdrawal', icon: ArrowUpFromLine },
};

export function getKindMeta(kind?: string) {
  if (kind && kind in KIND_META) {
    return KIND_META[kind as HistoryKind];
  }
  return { label: 'Transaction', icon: CircleHelp };
}

export function getAmountColor(direction: HistoryDirection, status: HistoryStatus) {
  if (status === 'FAILED' || status === 'CANCELED') {
    return '#ef4444';
  }
  if (status === 'PENDING') {
    return '#f59e0b';
  }
  return direction === 'IN' ? '#22c55e' : '#1f2937';
}

export function formatOccurredAt(value?: string) {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
