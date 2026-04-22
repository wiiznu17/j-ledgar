import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { AlertCircle, ChevronRight } from 'lucide-react-native';
import { TransferError, getErrorInfo } from '../../lib/error-handling';

interface ErrorRecoveryProps {
  error: TransferError;
  onRetry?: () => void;
  onEdit?: () => void;
  onBack?: () => void;
  onDismiss?: () => void;
}

export const ErrorRecovery: React.FC<ErrorRecoveryProps> = ({
  error,
  onRetry,
  onEdit,
  onBack,
  onDismiss,
}) => {
  const errorInfo = getErrorInfo(error);

  const handleAction = () => {
    switch (error.recoveryAction) {
      case 'RETRY':
        onRetry?.();
        break;
      case 'EDIT':
        onEdit?.();
        break;
      case 'FALLBACK':
        onBack?.();
        break;
      case 'CANCEL':
        onDismiss?.();
        break;
      default:
        onDismiss?.();
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      className="px-6 py-6 bg-red-50/40 rounded-3xl border border-red-100 mb-6"
    >
      {/* Error Header */}
      <View className="flex-row items-start gap-3 mb-4">
        <View className="w-12 h-12 bg-red-100 rounded-full items-center justify-center flex-shrink-0 mt-1">
          <AlertCircle size={24} color="#dc2626" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-manrope font-black text-red-700 mb-1">
            {errorInfo.title}
          </Text>
          <Text className="text-sm font-manrope font-bold text-red-600 leading-relaxed">
            {errorInfo.message}
          </Text>
        </View>
      </View>

      {/* Additional Details */}
      {error.details && (
        <View className="bg-red-100/30 px-4 py-2 rounded-lg mb-4">
          <Text className="text-xs font-manrope font-bold text-red-700">
            Details: {error.details}
          </Text>
        </View>
      )}

      {/* Action Button */}
      {(onRetry || onEdit || onBack || onDismiss) && (
        <TouchableOpacity
          onPress={handleAction}
          className="bg-red-600 px-5 py-3 rounded-xl flex-row items-center justify-between active:scale-95 mt-4"
        >
          <Text className="text-white font-manrope font-black text-sm">
            {errorInfo.actionLabel}
          </Text>
          <ChevronRight size={16} color="white" />
        </TouchableOpacity>
      )}
    </MotiView>
  );
};
