import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Landmark, ArrowRight, CheckCircle2, Zap } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import api from '@/lib/axios';

type BankAccount = {
  id: number;
  bankCode: string;
  bankName: string;
  accountNumberMasked: string;
  accountName: string;
  accountType: string;
  isDefault: boolean;
  isVerified: boolean;
};

export default function TopupScreen() {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBanks, setIsLoadingBanks] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const router = useRouter();

  const selectedAccount = useMemo(
    () => bankAccounts.find((account) => account.id === selectedBankId) ?? null,
    [bankAccounts, selectedBankId],
  );

  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        setIsLoadingBanks(true);
        const res = await api.get('/integration/bank-accounts');
        const accounts: BankAccount[] = res.data || [];
        setBankAccounts(accounts);

        if (accounts.length > 0) {
          const defaultAccount = accounts.find((account) => account.isDefault) || accounts[0];
          if (defaultAccount) {
            setSelectedBankId(defaultAccount.id);
          }
        } else {
          setSelectedBankId(null);
        }

        setError('');
      } catch (err: any) {
        setError(err?.response?.data?.message || 'ไม่สามารถโหลดบัญชีธนาคารได้');
      } finally {
        setIsLoadingBanks(false);
      }
    };

    fetchBankAccounts();
  }, []);

  const handleNextStep = () => {
    if (isSubmitting || !selectedAccount) {
      return;
    }

    setIsSubmitting(true);
    router.push({
      pathname: '/topup/review',
      params: {
        amount,
        bankAccountId: selectedAccount.id.toString(),
        bankCode: selectedAccount.bankCode,
        bankName: selectedAccount.bankName,
        accountNumberMasked: selectedAccount.accountNumberMasked,
      },
    } as any);
    setIsSubmitting(false);
  };

  const isAmountValid = amount && parseFloat(amount) > 0;
  const canContinue = Boolean(isAmountValid && selectedAccount && !isSubmitting && !isLoadingBanks);

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-1 px-5">
          <View className="flex-row items-center justify-between pt-2 pb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm"
            >
              <ChevronLeft size={24} color="#1a1a1a" />
            </TouchableOpacity>
            <Text className="text-lg font-manrope font-black text-gray-800 tracking-tight">Top Up Wallet</Text>
            <TouchableOpacity className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
              <Zap size={20} color="#f48fb1" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              className="bg-white p-8 rounded-[2.5rem] mb-8 items-center overflow-hidden border border-gray-50 shadow-xl shadow-pink-100/50 mt-2"
            >
              <View className="absolute -top-10 -right-10 w-32 h-32 bg-pink-50 rounded-full opacity-60" />

              <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-6">
                Select Top Up Amount
              </Text>

              <View className="flex-row items-center justify-center border-b-2 border-pink-100 pb-3 mb-8 w-full max-w-[260px]">
                <Text className="text-3xl font-manrope font-black text-gray-400 mr-2 mt-1">฿</Text>
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
                    fontSize: 48,
                    lineHeight: 56,
                    paddingVertical: 0,
                    marginVertical: 0,
                    includeFontPadding: false,
                    minWidth: 140,
                    height: 60,
                  }}
                  maxLength={9}
                />
              </View>

              <View className="flex-row flex-wrap justify-center gap-3">
                {['100', '500', '1,000', '5,000'].map((val) => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setAmount(val.replace(',', ''))}
                    className="px-5 py-2.5 rounded-xl bg-pink-50 border border-pink-100 shadow-sm active:scale-95"
                  >
                    <Text className="text-xs font-manrope font-black text-[#f48fb1]">{val}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </MotiView>

            <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest px-1 mb-4">
              Payment Method
            </Text>

            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 100 }}
              className="mb-6"
            >
              {isLoadingBanks ? (
                <View className="bg-white rounded-2xl p-6 border border-gray-100 items-center">
                  <ActivityIndicator color="#f48fb1" />
                  <Text className="text-xs font-manrope font-bold text-gray-400 mt-3">
                    กำลังโหลดบัญชีธนาคาร...
                  </Text>
                </View>
              ) : bankAccounts.length === 0 ? (
                <View className="bg-white rounded-2xl p-6 border border-gray-100">
                  <Text className="text-sm font-manrope font-black text-gray-700 text-center">
                    ยังไม่มีบัญชีธนาคาร
                  </Text>
                </View>
              ) : (
                bankAccounts.map((account) => {
                  const isSelected = selectedBankId === account.id;
                  return (
                    <TouchableOpacity
                      key={account.id}
                      onPress={() => setSelectedBankId(account.id)}
                      className={`flex-row items-center justify-between p-5 rounded-[2rem] mb-4 border ${
                        isSelected
                          ? 'bg-white border-pink-200 shadow-md shadow-pink-100'
                          : 'bg-white border-gray-100'
                      }`}
                    >
                      <View className="flex-row items-center gap-4 flex-1">
                        <View className="w-12 h-12 rounded-[1.2rem] items-center justify-center bg-pink-50">
                          <Landmark size={20} color="#f48fb1" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-manrope font-black text-gray-800">
                            {account.bankName}
                          </Text>
                          <Text className="text-[10px] font-manrope font-bold text-gray-400 mt-1">
                            {account.accountNumberMasked}
                          </Text>
                        </View>
                      </View>
                      <View
                        className={`w-5 h-5 rounded-full border-[1.5px] items-center justify-center ${
                          isSelected ? 'bg-[#f48fb1] border-[#f48fb1]' : 'bg-white border-gray-300'
                        }`}
                      >
                        {isSelected ? <CheckCircle2 size={12} color="white" /> : null}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </MotiView>

            {error ? (
              <View className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6">
                <Text className="text-xs font-manrope font-bold text-red-500 text-center">{error}</Text>
              </View>
            ) : null}

            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 200 }}
            >
              <TouchableOpacity
                disabled={!canContinue}
                onPress={handleNextStep}
                className={`w-full h-16 rounded-2xl flex-row items-center justify-center gap-2 shadow-lg ${
                  canContinue
                    ? 'bg-[#f48fb1] shadow-pink-200 active:scale-95'
                    : 'bg-gray-200 shadow-none'
                }`}
              >
                <Text
                  className={`font-manrope font-black text-base ${
                    canContinue ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {isSubmitting ? 'Processing...' : 'Review Top Up'}
                </Text>
                {canContinue ? <ArrowRight size={20} color="white" /> : null}
              </TouchableOpacity>
            </MotiView>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
