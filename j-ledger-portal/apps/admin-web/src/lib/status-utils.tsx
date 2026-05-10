import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
  Shield,
  AlertTriangle,
  XCircle,
  RefreshCcw,
  LucideIcon,
  Search,
  FileCheck,
} from 'lucide-react';

export interface StatusConfig {
  color: string;
  icon: LucideIcon;
  borderColor?: string;
  bgColor?: string;
  textColor?: string;
}

/**
 * Utility to get consistent styling and icons for different system statuses.
 */

export const getUserStatusConfig = (
  status: string | null | undefined,
): StatusConfig => {
  const s = status?.toUpperCase() || '';
  switch (s) {
    case 'ACTIVE':
      return {
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: CheckCircle2,
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-200',
      };
    case 'PENDING_APPROVAL':
    case 'PENDING':
      return {
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: Clock,
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-200',
      };
    case 'SUSPENDED':
      return {
        color: 'bg-orange-100 text-orange-700 border-orange-200',
        icon: AlertCircle,
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-200',
      };
    case 'BLOCKED':
    case 'REJECTED':
      return {
        color: 'bg-rose-100 text-rose-700 border-rose-200',
        icon: Lock,
        bgColor: 'bg-rose-50',
        textColor: 'text-rose-700',
        borderColor: 'border-rose-200',
      };
    default:
      return {
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: Shield,
        bgColor: 'bg-slate-50',
        textColor: 'text-slate-700',
        borderColor: 'border-slate-200',
      };
  }
};

export const getTransactionStatusConfig = (
  status: string | null | undefined,
): StatusConfig => {
  const s = status?.toUpperCase() || '';
  switch (s) {
    case 'COMPLETED':
    case 'SUCCESS':
      return {
        color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        icon: CheckCircle2,
      };
    case 'PENDING':
    case 'PROCESSING':
      return {
        color: 'bg-amber-50 text-amber-700 border-amber-100',
        icon: Clock,
      };
    case 'FAILED':
    case 'DECLINED':
      return {
        color: 'bg-rose-50 text-rose-700 border-rose-100',
        icon: XCircle,
      };
    case 'REVERSED':
      return {
        color: 'bg-slate-50 text-slate-700 border-slate-100',
        icon: RefreshCcw,
      };
    default:
      return {
        color: 'bg-slate-50 text-slate-600 border-slate-100',
        icon: AlertTriangle,
      };
  }
};

export const getKycStatusConfig = (
  status: string | null | undefined,
): StatusConfig => {
  const s = status?.toUpperCase() || '';
  switch (s) {
    case 'APPROVED':
    case 'VERIFIED':
      return {
        color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        icon: FileCheck,
      };
    case 'PENDING_REVIEW':
    case 'PENDING':
      return {
        color: 'bg-amber-50 text-amber-700 border-amber-100',
        icon: Search,
      };
    case 'REJECTED':
      return {
        color: 'bg-rose-50 text-rose-700 border-rose-100',
        icon: XCircle,
      };
    default:
      return {
        color: 'bg-slate-50 text-slate-600 border-slate-100',
        icon: Shield,
      };
  }
};
