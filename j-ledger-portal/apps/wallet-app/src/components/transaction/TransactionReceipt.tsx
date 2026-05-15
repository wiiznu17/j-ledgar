import React from 'react';
import { View, Text, TouchableOpacity, Share, Platform } from 'react-native';
import { CheckCircle2, Calendar, Hash, Copy, Store, User, Share2 } from 'lucide-react-native';
import { MotiView } from 'moti';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

interface TransactionReceiptProps {
  amount: number;
  transactionId: string;
  timestamp: string;
  recipientName: string;
  recipientType: 'merchant' | 'user';
  onDone: () => void;
}

export const TransactionReceipt: React.FC<TransactionReceiptProps> = ({
  amount,
  transactionId,
  timestamp,
  recipientName,
  recipientType,
  onDone,
}) => {
  
  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(transactionId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Payment Successful to ${recipientName}: ฿${amount.toLocaleString()} (Ref: ${transactionId})`,
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
    }
  };

  const displayDate = new Date(timestamp).toLocaleDateString('th-TH', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
  const displayTime = new Date(timestamp).toLocaleTimeString('th-TH', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9, translateY: 20 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15 }}
      className="flex-1"
    >
      <View className="bg-white rounded-[3rem] p-8 border border-gray-50 shadow-2xl shadow-pink-200/30 overflow-hidden relative">
        {/* Decorative elements */}
        <View className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full -mr-16 -mt-16 opacity-50" />
        
        <View className="items-center mb-8">
          <MotiView
            from={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 200 }}
            className="w-20 h-20 bg-green-50 rounded-full items-center justify-center mb-6"
          >
            <CheckCircle2 size={44} color="#22c55e" />
          </MotiView>
          <Text className="text-2xl font-manrope font-black text-gray-800">Payment Successful</Text>
          <Text className="text-gray-400 font-manrope font-bold mt-1">
            Receipt ID: {transactionId.slice(-8).toUpperCase()}
          </Text>
        </View>

        <View className="bg-pink-50/50 rounded-3xl p-6 items-center mb-8 border border-pink-100/50">
          <Text className="text-gray-400 font-manrope font-black text-[10px] uppercase tracking-[3px] mb-2">
            Total Amount Paid
          </Text>
          <Text className="text-4xl font-manrope font-black text-[#f48fb1]">
            ฿{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Text>
        </View>

        <View className="gap-5">
          <DetailRow 
            icon={recipientType === 'merchant' ? <Store size={18} color="#9ca3af" /> : <User size={18} color="#9ca3af" />}
            label={recipientType === 'merchant' ? "To Merchant" : "To Recipient"}
            value={recipientName}
          />

          <DetailRow 
            icon={<Calendar size={18} color="#9ca3af" />}
            label="Date & Time"
            value={`${displayDate}, ${displayTime}`}
          />

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Hash size={18} color="#9ca3af" />
              <Text className="font-manrope font-bold text-gray-400 text-sm">Ref ID</Text>
            </View>
            <TouchableOpacity 
              onPress={copyToClipboard}
              className="flex-row items-center gap-2"
            >
              <Text className="font-manrope font-black text-gray-800 text-sm">
                {transactionId.slice(0, 12)}...
              </Text>
              <Copy size={14} color="#f48fb1" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="h-[1px] bg-gray-100 my-8 border-dashed border-t border-gray-300" />
        
        <Text className="text-center text-[10px] font-manrope font-bold text-gray-400 leading-relaxed uppercase tracking-widest px-4">
          Official Electronic Receipt • Secured by J-Ledger
        </Text>
      </View>

      <View className="mt-8 gap-4">
        <TouchableOpacity
          onPress={onDone}
          activeOpacity={0.8}
          className="w-full h-16 bg-[#1a1a1a] rounded-2xl items-center justify-center shadow-xl"
        >
          <Text className="font-manrope font-black text-white text-base">Done</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={handleShare}
          activeOpacity={0.7}
          className="w-full h-16 bg-white border border-gray-100 rounded-2xl flex-row items-center justify-center gap-3"
        >
          <Share2 size={20} color="#1a1a1a" />
          <Text className="font-manrope font-black text-gray-800 text-base">Share Receipt</Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  );
};

const DetailRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <View className="flex-row items-center justify-between">
    <View className="flex-row items-center gap-3">
      {icon}
      <Text className="font-manrope font-bold text-gray-400 text-sm">{label}</Text>
    </View>
    <Text className="font-manrope font-black text-gray-800 text-sm flex-1 text-right ml-4" numberOfLines={1}>
      {value}
    </Text>
  </View>
);
