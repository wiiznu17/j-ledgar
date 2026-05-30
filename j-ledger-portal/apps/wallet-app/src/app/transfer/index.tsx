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
import { TransactionRecipientCard } from '@/components/transaction/TransactionRecipientCard';
import { TransactionSearchArea } from '@/components/transaction/TransactionSearchArea';
import { ChevronLeft, Info } from 'lucide-react-native';

export default function TransferScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    merchantId?: string;
    paymentId?: string;
    recipient?: string;
    amount?: string;
    merchantName?: string;
  }>();

  const [recipient, setRecipient] = React.useState<any>(null);
  const [search, setSearch] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [note, setNote] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [recipientNotFound, setRecipientNotFound] = React.useState(false);
  const [merchant, setMerchant] = React.useState<any>(null);
  const [isLoadingMerchant, setIsLoadingMerchant] = React.useState(false);
  const [favorites, setFavorites] = React.useState<any[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = React.useState(false);

  React.useEffect(() => {
    if (!recipient && !(params.merchantId || params.paymentId)) {
      loadFavorites();
    }
  }, [recipient]);

  const loadFavorites = async () => {
    try {
      setIsLoadingFavorites(true);
      const res = await api.get('/integration/p2p/favorites');
      setFavorites(res.data || []);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setIsLoadingFavorites(false);
    }
  };

  const handleSelectFavorite = async (phone: string) => {
    setIsSubmitting(true);
    setRecipientNotFound(false);
    
    // Format phone for search field display
    const cleaned = phone.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 3 && cleaned.length <= 6) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else if (cleaned.length > 6) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
    setSearch(formatted);

    try {
      const res = await api.post('/integration/p2p/preview', {
        recipientPhone: phone,
        amount: parseFloat(amount) || 1, // Just for preview
      });
      const preview = res.data || {};
      setRecipient({
        phone: phone,
        displayName: preview?.recipient?.displayName || 'Unknown User',
        phoneMasked: preview?.recipient?.phoneMasked || phone,
      });
    } catch (err: any) {
      setRecipientNotFound(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    // Handle params from QR scan (validated by qr-validation)
    if (params.recipient) {
      handleRecipientChange(params.recipient);
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

  // Auto-search when search is populated from params
  React.useEffect(() => {
    if (
      params.recipient &&
      search.replace(/\D/g, '').length >= 10 &&
      !recipient &&
      !isSubmitting
    ) {
      handleSearch();
    }
  }, [search, params.recipient]);

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
    if (cleaned.length > 3 && cleaned.length <= 6) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else if (cleaned.length > 6) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
    setSearch(formatted);
  };

  const handleSearch = async () => {
    if (search.replace(/\D/g, '').length < 10) return;

    setIsSubmitting(true);
    setRecipientNotFound(false);

    try {
      const res = await api.post('/integration/p2p/preview', {
        recipientPhone: search,
        amount: parseFloat(amount) || 1, // Just for preview
      });
      const preview = res.data || {};
      setRecipient({
        phone: search,
        displayName: preview?.recipient?.displayName || 'Unknown User',
        phoneMasked: preview?.recipient?.phoneMasked || search,
      });
    } catch (err: any) {
      setRecipientNotFound(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (isSubmitting) return;

    if (params.merchantId || params.paymentId) {
      // Merchant Pay logic remains
      router.push({
        pathname: '/transfer/review',
        params: {
          merchantId: params.merchantId,
          paymentId: params.paymentId,
          amount,
          note,
          merchantName: merchant?.merchantName,
        },
      } as any);
      return;
    }

    // For P2P, we already have the recipient object from handleSearch
    if (!recipient) {
      handleSearch();
      return;
    }

    router.push({
      pathname: '/transfer/review',
      params: {
        recipient: recipient.phone,
        amount,
        note,
        recipientName: recipient.displayName,
        recipientMasked: recipient.phoneMasked,
      },
    } as any);
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
                /* Unified Merchant Mode */
                <TransactionRecipientCard
                  name={merchant?.merchantName}
                  subtitle={
                    merchant?.category ||
                    (params.paymentId ? 'Payment Request' : 'Verified Business')
                  }
                  type="merchant"
                />
              ) : recipient ? (
                /* Selected Person Mode */
                <TransactionRecipientCard
                  name={(recipient as any).displayName}
                  subtitle={(recipient as any).phoneMasked}
                  type="user"
                  onClear={() => {
                    setRecipient('' as any);
                    setAmount('');
                  }}
                />
              ) : (
                /* Search Mode */
                <TransactionSearchArea
                  value={search}
                  onChangeText={handleRecipientChange}
                  onSearch={handleSearch}
                  onClear={() => setSearch('')}
                  isLoading={isSubmitting}
                />
              )}
            </MotiView>

            {/* Favorite Recipients Horizontal list */}
            {!recipient && !(params.merchantId || params.paymentId) && favorites.length > 0 && (
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                className="mb-6"
              >
                <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  Favorite Contacts
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingLeft: 4 }}
                >
                  {favorites.map((fav) => (
                    <TouchableOpacity
                      key={fav.id}
                      onPress={() => handleSelectFavorite(fav.recipientPhone)}
                      className="items-center w-16 active:scale-95 transition-all"
                    >
                      <View className="w-12 h-12 rounded-full bg-purple-50 border border-purple-100 items-center justify-center mb-1 shadow-sm">
                        <Text className="font-manrope font-black text-purple-500 text-sm">
                          {(fav.nickname || fav.recipientName || 'U').slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        numberOfLines={1}
                        className="text-[10px] font-manrope font-black text-gray-600 text-center w-full"
                      >
                        {fav.nickname || fav.recipientName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </MotiView>
            )}

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
        disabled={
          isSubmitting ||
          (!params.merchantId && !params.paymentId && !recipient) ||
          !amount ||
          parseFloat(amount) <= 0
        }
        isLoading={isSubmitting}
      />
    </SafeAreaView>
  );
}
