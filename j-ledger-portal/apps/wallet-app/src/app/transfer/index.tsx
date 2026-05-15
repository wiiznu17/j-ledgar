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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { TransferParamsSchema } from '../../types/transfer';
import { api } from '@/lib/axios';
import { MerchantService } from '@/lib/merchant-service';
import { TransactionAmountCard } from '@/components/transaction/TransactionAmountCard';
import { StickyActionArea } from '@/components/transaction/StickyActionArea';
import { Store, User, Search, SearchIcon, ChevronLeft, Info, X } from 'lucide-react-native';

export default function TransferScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    merchantId?: string, 
    paymentId?: string,
    recipient?: string, 
    amount?: string,
    merchantName?: string 
  }>();

  const [recipient, setRecipient] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [note, setNote] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [recipientNotFound, setRecipientNotFound] = React.useState(false);
  const [merchant, setMerchant] = React.useState<any>(null);
  const [isLoadingMerchant, setIsLoadingMerchant] = React.useState(false);

  React.useEffect(() => {
    // Handle params from QR scan (validated by qr-validation)
    if (params.recipient) {
      setRecipient(params.recipient);
    }
    if (params.amount) {
      setAmount(params.amount);
    }
    if (params.merchantId) {
      loadMerchantInfo(params.merchantId);
    } else if (params.paymentId) {
      loadPaymentDetails(params.paymentId);
    }
  }, [params.merchantId, params.paymentId, params.recipient, params.amount]);

  const loadPaymentDetails = async (id: string) => {
    try {
      setIsLoadingMerchant(true);
      const data = await MerchantService.getPaymentDetail(id);
      setMerchant({
        merchantName: data.merchantName,
        category: 'Merchant Payment',
      });
      setAmount(data.amount.toString());
    } catch (err) {
      console.error('Failed to load payment details:', err);
      Alert.alert('Error', 'Invalid or expired payment request');
    } finally {
      setIsLoadingMerchant(false);
    }
  };

  const loadMerchantInfo = async (id: string) => {
    try {
      setIsLoadingMerchant(true);
      const data = await MerchantService.previewManualPayment(id);
      setMerchant(data);
    } catch (err) {
      console.error('Failed to load merchant:', err);
      Alert.alert('Error', 'Could not find merchant information');
    } finally {
      setIsLoadingMerchant(false);
    }
  };

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

    if (params.merchantId || params.paymentId) {
      // Merchant Pay doesn't need preview, go straight to review
      router.push({
        pathname: '/transfer/review',
        params: {
          merchantId: params.merchantId || params.paymentId, // Use either as key
          amount,
          note,
          merchantName: merchant?.merchantName,
        },
      } as any);
      return;
    }

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
        const message =
          err?.response?.data?.message || 'Unable to preview transfer';
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
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              className="mt-4 mb-6"
            >
              {params.merchantId || params.paymentId ? (
                /* Unified Merchant Header */
                <View className="bg-white rounded-[2.5rem] p-6 border border-gray-100 flex-row items-center shadow-sm">
                  <View className="w-16 h-16 bg-pink-50 rounded-[1.5rem] items-center justify-center border border-pink-100">
                    <Store size={32} color="#f48fb1" />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-1">
                      {params.paymentId ? 'Payment Request' : 'Paying To Merchant'}
                    </Text>
                    <Text className="text-xl font-manrope font-black text-gray-800" numberOfLines={1}>
                      {merchant?.merchantName || 'Loading...'}
                    </Text>
                    <Text className="text-xs font-manrope font-bold text-gray-400">
                      {merchant?.category || 'Verified Business'}
                    </Text>
                  </View>
                </View>
              ) : (
                /* Original P2P Input */
                <View>
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
              )}
            </MotiView>

            {/* Amount Card */}
            <TransactionAmountCard 
              amount={amount}
              onAmountChange={setAmount}
              label="Total Amount to Send"
            />

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
                    This phone number is not registered in P-wallet. Please
                    check the number or invite them to join.
                  </Text>
                </View>
              </MotiView>
            )}

            {/* Warning Banner */}
            <View className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex-row items-center gap-3 mb-6">
              <Info size={14} color="#f97316" />
              <Text className="text-[9px] font-manrope font-bold text-gray-500 leading-relaxed flex-1">
                Please confirm the recipient's identity. Transfers cannot be
                refunded.
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Sticky Action Area */}
      <StickyActionArea 
        isVisible={true}
        label={isSubmitting ? 'Processing...' : 'Next Step'}
        onPress={handleNext}
        disabled={isSubmitting || (!params.merchantId && !params.paymentId && !recipient) || !amount || parseFloat(amount) <= 0}
        isLoading={isSubmitting}
      />
    </SafeAreaView>
  );
}
