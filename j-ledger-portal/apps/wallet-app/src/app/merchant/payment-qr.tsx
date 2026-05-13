import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, QrCode, Copy, Share2, CheckCircle2 } from 'lucide-react-native';
import { MerchantService } from '@/lib/merchant-service';
import * as Clipboard from 'expo-clipboard';

export default function MerchantPaymentQRScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrResult, setQrResult] = useState<any>(null);

  const handleGenerateQR = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to receive payment.');
      return;
    }

    setIsGenerating(true);
    try {
      const dashboard = await MerchantService.getDashboard();
      if (!dashboard.isMerchant || !dashboard.merchantId) {
          throw new Error('You are not registered as a merchant or merchant ID is missing.');
      }

      const result = await MerchantService.generatePaymentQR(dashboard.merchantId, parseFloat(amount));
      setQrResult(result);
    } catch (error: any) {
      console.error('[Merchant QR] Error:', error);
      Alert.alert('Error', error.message || 'Failed to generate QR code.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (qrResult?.payUrl) {
      await Clipboard.setStringAsync(qrResult.payUrl);
      Alert.alert('Copied', 'Payment link copied to clipboard.');
    }
  };

  const shareQR = async () => {
    if (qrResult?.qrCode) {
      try {
        await Share.share({
          url: Platform.OS === 'ios' ? qrResult.qrCode : undefined,
          message: `Pay me ฿${amount} on J-Ledger\n${qrResult.payUrl || ''}`,
        });
      } catch (error) {
        console.log('Share error:', error);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center"
          >
            <ChevronLeft size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text className="text-lg font-manrope font-black text-gray-800 tracking-tight">
            Receive Payment
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView 
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {!qrResult ? (
            <View className="pt-10">
              <View className="items-center mb-10">
                <View className="w-20 h-20 bg-amber-50 rounded-3xl items-center justify-center mb-4 border border-amber-100">
                  <QrCode size={40} color="#f59e0b" />
                </View>
                <Text className="text-2xl font-manrope font-black text-gray-800">Enter Amount</Text>
                <Text className="text-sm text-gray-400 font-bold mt-1">Set the price for your customer</Text>
              </View>

              <View className="bg-white rounded-[2.5rem] p-8 border border-gray-100">
                <View className="flex-row items-center justify-center border-b-2 border-gray-100 pb-4 mb-10">
                  <Text className="text-4xl font-manrope font-black text-gray-300 mr-3">฿</Text>
                  <TextInput
                    className="text-5xl font-manrope font-black text-gray-800 flex-1"
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  onPress={handleGenerateQR}
                  disabled={isGenerating || !amount}
                  style={{
                    backgroundColor: isGenerating || !amount ? '#fde68a' : '#f59e0b',
                  }}
                  className="h-16 rounded-2xl flex-row items-center justify-center gap-3"
                >
                  {isGenerating ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text className="text-white font-manrope font-black text-base">Generate QR Code</Text>
                      <QrCode size={20} color="white" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="pt-6 items-center">
              <View className="bg-white rounded-[3rem] p-10 items-center w-full border border-gray-100">
                <View className="flex-row items-center mb-6">
                  <CheckCircle2 size={20} color="#10b981" />
                  <Text className="ml-2 text-emerald-500 font-manrope font-black uppercase tracking-widest text-[10px]">QR Code Generated</Text>
                </View>

                <Text className="text-4xl font-manrope font-black text-gray-800 mb-8">
                  ฿{parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>

                <View className="p-4 bg-white border-4 border-gray-50 rounded-[2.5rem] mb-8">
                  <Image 
                    source={{ uri: qrResult.qrCode }} 
                    className="w-64 h-64"
                    resizeMode="contain"
                  />
                </View>

                <Text className="text-xs text-gray-400 font-bold text-center px-10 mb-8">
                  Show this QR code to your customer. It will expire in 15 minutes.
                </Text>

                <View className="flex-row gap-4 w-full">
                  <TouchableOpacity 
                    onPress={copyToClipboard}
                    className="flex-1 h-14 bg-gray-50 rounded-2xl flex-row items-center justify-center gap-2 border border-gray-100 active:scale-95"
                  >
                    <Copy size={18} color="#64748b" />
                    <Text className="text-gray-600 font-manrope font-black text-xs">Copy Link</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={shareQR}
                    className="flex-1 h-14 bg-gray-50 rounded-2xl flex-row items-center justify-center gap-2 border border-gray-100 active:scale-95"
                  >
                    <Share2 size={18} color="#64748b" />
                    <Text className="text-gray-600 font-manrope font-black text-xs">Share QR</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => setQrResult(null)}
                className="mt-8 py-4 px-10"
              >
                <Text className="text-amber-500 font-manrope font-black">Create New Request</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
