import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Info, ArrowRight, X } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
import { TransferParamsSchema } from '../../types/transfer';
import { api } from '@/lib/axios';

export default function TransferScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [recipient, setRecipient] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [note, setNote] = React.useState((params.merchantName as string) || '');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [recipientNotFound, setRecipientNotFound] = React.useState(false);

  React.useEffect(() => {
    // Handle params from QR scan (validated by qr-validation)
    if (params.recipient) {
      setRecipient(params.recipient as string);
    }
    if (params.amount) {
      setAmount(params.amount as string);
    }
    if (params.merchantName) {
      setNote(params.merchantName as string);
    }
  }, [params]);

  const handleRecipientChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    // ... (logic follows)
    if (cleaned.length > 3 && cleaned.length <= 6) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else if (cleaned.length > 6) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
    setRecipient(formatted);
  };

  const handleNext = () => {
    if (isSubmitting) return;
    setRecipientNotFound(false);

    // Validate transfer params using Zod schema
    const validation = TransferParamsSchema.safeParse({
      recipient: recipient.replace(/\D/g, ''),
      amount: amount,
    });

    if (!validation.success) {
      const firstError = validation.error.issues?.[0];
      let errorMessage = firstError?.message || 'Validation error';

      if (firstError?.path?.[0] === 'recipient') {
        errorMessage = 'Please enter a valid recipient phone number';
      } else if (firstError?.path?.[0] === 'amount') {
        errorMessage = 'Please enter a valid amount greater than 0';
      }

      Alert.alert('Validation Error', errorMessage);
      return;
    }

    setIsSubmitting(true);
    api
      .post('/integration/p2p/preview', {
        recipientPhone: recipient,
        amount: parseFloat(amount),
      })
      .then((res) => {
        const preview = res.data || {};
        router.push({
          pathname: '/transfer/review',
          params: {
            recipient,
            amount,
            note,
            recipientName: preview?.recipient?.displayName || '',
            recipientMasked: preview?.recipient?.phoneMasked || '',
          },
        } as any);
      })
      .catch((err: any) => {
        const message = err?.response?.data?.message || 'Unable to preview transfer';
        const status = err?.response?.status;

        // Show warning banner for recipient not found errors
        const isRecipientNotFound =
          status === 404 ||
          message.toLowerCase().includes('not found') ||
          message.toLowerCase().includes('recipient');

        if (isRecipientNotFound) {
          setRecipientNotFound(true);
          // Don't show Alert for recipient not found - banner is sufficient
          return;
        }

        Alert.alert('Transfer Error', message);
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleQuickAmount = (val: string) => {
    setAmount(val);
  };

  return (
    <SafeAreaView className="flex-1 bg-transparent" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-5">
          {/* Header */}
          <View className="flex-row items-center justify-between pt-2 pb-2">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm"
            >
              <ChevronLeft size={24} color="#1a1a1a" />
            </TouchableOpacity>
            <Text className="text-lg font-manrope font-black text-gray-800 tracking-tight">
              Transfer Money
            </Text>
            <View className="w-10" />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View className="mb-6 mt-4">
              <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest px-1 mb-3">
                Recipient Phone Number
              </Text>
              <View className="bg-white rounded-2xl px-5 py-4 flex-row items-center border border-gray-50 shadow-sm">
                <TextInput
                  placeholder="08X-XXX-XXXX"
                  placeholderTextColor="#d1d5db"
                  value={recipient}
                  onChangeText={handleRecipientChange}
                  keyboardType="number-pad"
                  className="flex-1 font-manrope font-black text-gray-800 text-lg tracking-[0.05em]"
                  style={{ paddingVertical: 0 }}
                  maxLength={12}
                />
                {recipient.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setRecipient('')}
                    className="w-6 h-6 bg-gray-100 rounded-full items-center justify-center p-1"
                  >
                    <X size={14} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Amount Card */}
            <View className="bg-white rounded-[2rem] p-6 mb-6 items-center border border-gray-50 shadow-sm relative overflow-hidden">
              <View className="absolute -top-10 -right-10 w-24 h-24 bg-pink-50 rounded-full opacity-60" />

              <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-4">
                Total Amount to Send
              </Text>

              <View className="flex-row items-center justify-center border-b-2 border-pink-100 pb-2 mb-6 w-full max-w-[220px]">
                <Text className="text-2xl font-manrope font-black text-gray-400 mr-2">฿</Text>
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor="#d1d5db"
                  value={amount}
                  onChangeText={(text) => {
                    const filtered = text.replace(/[^0-9.]/g, '');
                    if (filtered.split('.').length > 2) return;
                    setAmount(filtered);
                  }}
                  keyboardType="decimal-pad"
                  selectionColor="#f48fb1"
                  className="font-manrope font-black text-[#f48fb1] text-center"
                  style={{
                    fontSize: 40,
                    lineHeight: 48,
                    paddingVertical: 0,
                    marginVertical: 0,
                    includeFontPadding: false,
                    minWidth: 120,
                    height: 50,
                  }}
                  maxLength={9}
                />
              </View>

              <View className="flex-row gap-3">
                {['100', '500', '1,000'].map((val) => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => handleQuickAmount(val.replace(',', ''))}
                    className="px-4 py-2 rounded-xl bg-pink-50 border border-pink-100 active:scale-95"
                  >
                    <Text className="text-[10px] font-manrope font-black text-[#f48fb1]">
                      {val}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Note Input */}
            <View className="mb-6">
              <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 flex-row items-center">
                <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase mr-3">
                  Note:
                </Text>
                <TextInput
                  placeholder="Add a payment note..."
                  placeholderTextColor="#9ca3af"
                  value={note}
                  onChangeText={setNote}
                  className="flex-1 font-manrope font-bold text-xs text-gray-800"
                  style={{ paddingVertical: 4 }}
                />
              </View>
            </View>

            {/* Recipient Not Found Warning */}
            {recipientNotFound && (
              <MotiView
                from={{ opacity: 0, translateY: -10 }}
                animate={{ opacity: 1, translateY: 0 }}
                className="bg-red-50 p-4 rounded-2xl border border-red-100 flex-row items-center gap-3 mb-4"
              >
                <Info size={16} color="#ef4444" />
                <View className="flex-1">
                  <Text className="text-xs font-manrope font-black text-red-600 mb-0.5">
                    Recipient Not Found
                  </Text>
                  <Text className="text-[10px] font-manrope font-medium text-red-500 leading-relaxed">
                    This phone number is not registered in P-wallet. Please check the number or
                    invite them to join.
                  </Text>
                </View>
              </MotiView>
            )}

            {/* Warning Banner */}
            <View className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex-row items-center gap-3 mb-6">
              <Info size={14} color="#f97316" />
              <Text className="text-[9px] font-manrope font-bold text-gray-500 leading-relaxed flex-1">
                Please confirm the recipient's identity. Transfers cannot be refunded.
              </Text>
            </View>

            {/* Submit Button */}
            <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}>
              <TouchableOpacity
                disabled={isSubmitting || !recipient || !amount || parseFloat(amount) <= 0}
                onPress={handleNext}
                className={`w-full h-14 rounded-2xl flex-row items-center justify-center gap-2 shadow-lg transition-all
                  ${
                    isSubmitting || !recipient || !amount || parseFloat(amount) <= 0
                      ? 'bg-gray-200 shadow-none'
                      : 'bg-[#f48fb1] shadow-pink-200 active:scale-95'
                  }`}
              >
                <Text
                  className={`font-manrope font-black text-sm ${!recipient || !amount || isSubmitting ? 'text-gray-400' : 'text-white'}`}
                >
                  {isSubmitting ? 'Processing...' : 'Next Step'}
                </Text>
                {!isSubmitting && (
                  <ArrowRight size={18} color={!recipient || !amount ? '#9ca3af' : 'white'} />
                )}
              </TouchableOpacity>
            </MotiView>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
