import React, { useState, useEffect } from 'react';
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
import { router } from 'expo-router';
import { QrCode, Copy, Share2, Store, Zap, X, ChevronRight } from 'lucide-react-native';
import { MerchantService } from '@/lib/merchant-service';
import * as Clipboard from 'expo-clipboard';

export default function MerchantPaymentQRScreen() {
  const [amount, setAmount] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [staticQR, setStaticQR] = useState<any>(null);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [merchantProfile, setMerchantProfile] = useState<any>(null);
  const [showAmountInput, setShowAmountInput] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const dashboard = await MerchantService.getDashboard();
        if (dashboard.isMerchant && dashboard.merchantId) {
          setMerchantId(dashboard.merchantId);
          setMerchantProfile(dashboard.profile);
          const sQR = await MerchantService.getStaticQR(dashboard.merchantId);
          setStaticQR(sQR);
          setQrData(sQR);
        }
      } catch (error) {
        console.error('[Merchant Receive Init] Error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleGenerateDynamicQR = async () => {
    if (!amount || parseFloat(amount || '0') < 5.00) {
      Alert.alert('Invalid Amount', 'Minimum payment amount is ฿5.00.');
      return;
    }
    if (!merchantId) return;
    setIsGenerating(true);
    try {
      const result = await MerchantService.generatePaymentQR(merchantId, parseFloat(amount));
      setQrData(result);
      setShowAmountInput(false);
    } catch (error: any) {
      console.error('[Merchant QR] Error:', error);
      Alert.alert('Error', error.message || 'Failed to generate QR code.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetToStatic = () => {
    setQrData(staticQR);
    setAmount('');
    setShowAmountInput(false);
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'Link copied to clipboard.');
  };

  const shareQR = async (url: string, msg: string) => {
    try {
      await Share.share({
        url: Platform.OS === 'ios' ? url : undefined,
        message: msg,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8f9fe', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#f48fb1" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fe', paddingTop: Platform.OS === 'ios' ? 44 : 20 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        {/* Minimalist Header */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Store size={14} color="#f48fb1" />
            <Text style={{ fontSize: 14, fontFamily: 'Manrope_800ExtraBold', color: '#1f2937' }}>Payment QR</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <X size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
          
          {/* Large Focused Card */}
          <View style={{ backgroundColor: '#ffffff', borderRadius: 36, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#f48fb1', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 30, elevation: 8 }}>
            
            <Text style={{ fontSize: 20, fontFamily: 'Manrope_800ExtraBold', color: '#1f2937', marginBottom: 2 }}>{merchantProfile?.name || 'My Shop'}</Text>
            <Text style={{ fontSize: 12, fontFamily: 'Manrope_600SemiBold', color: '#94a3b8', marginBottom: 16 }}>{merchantProfile?.category || 'Retailer'}</Text>

            <View style={{ backgroundColor: amount ? '#fdf2f8' : '#f0fdf4', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, marginBottom: 16, borderWidth: 1, borderColor: amount ? '#fbcfe8' : '#dcfce7' }}>
              <Text style={{ fontSize: 10, fontFamily: 'Manrope_800ExtraBold', color: amount ? '#f48fb1' : '#10b981', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {amount ? `Dynamic (฿${amount})` : 'Shop Static QR'}
              </Text>
            </View>

            {/* Maximized QR Frame */}
            <View style={{ padding: 12, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f8fafc', borderRadius: 32, marginBottom: 16 }}>
              {qrData?.qrCode ? (
                <Image source={{ uri: qrData.qrCode }} style={{ width: 260, height: 260 }} resizeMode="contain" />
              ) : (
                <View style={{ width: 260, height: 260, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator color="#f48fb1" size="large" />
                </View>
              )}
            </View>

            {/* Slim Set Amount Trigger */}
            {!showAmountInput ? (
              <TouchableOpacity 
                onPress={() => setShowAmountInput(true)}
                style={{ backgroundColor: '#f8fafc', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 4 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Zap size={16} color="#f48fb1" />
                  <Text style={{ fontSize: 13, fontFamily: 'Manrope_700Bold', color: '#64748b' }}>Update to Specific Amount</Text>
                </View>
                <ChevronRight size={16} color="#cbd5e1" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: '100%', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16, marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 14, paddingHorizontal: 16, height: 48, marginBottom: 12 }}>
                  <Text style={{ fontSize: 20, fontFamily: 'Manrope_800ExtraBold', color: '#cbd5e1', marginRight: 8 }}>฿</Text>
                  <TextInput
                    style={{ fontSize: 20, fontFamily: 'Manrope_800ExtraBold', color: '#1f2937', flex: 1 }}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                    autoFocus
                  />
                  <TouchableOpacity onPress={() => setShowAmountInput(false)}><X size={20} color="#9ca3af" /></TouchableOpacity>
                </View>
                {amount && parseFloat(amount) < 5.00 && (
                  <Text style={{ fontSize: 11, fontFamily: 'Manrope_600SemiBold', color: '#f87171', marginBottom: 12, marginLeft: 4 }}>
                    * Minimum amount is ฿5.00
                  </Text>
                )}
                <TouchableOpacity
                  onPress={handleGenerateDynamicQR}
                  disabled={isGenerating || !amount}
                  style={{ height: 48, borderRadius: 14, backgroundColor: isGenerating || !amount ? '#fbcfe8' : '#f48fb1', alignItems: 'center', justifyContent: 'center' }}
                >
                  {isGenerating ? <ActivityIndicator size="small" color="white" /> : <Text style={{ color: 'white', fontFamily: 'Manrope_800ExtraBold', fontSize: 14 }}>Generate New QR</Text>}
                </TouchableOpacity>
              </View>
            )}

            {amount && !showAmountInput && (
              <TouchableOpacity onPress={handleResetToStatic} style={{ paddingVertical: 4 }}>
                <Text style={{ color: '#f48fb1', fontFamily: 'Manrope_700Bold', fontSize: 12 }}>Reset to Static</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Compact Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <TouchableOpacity 
              onPress={() => qrData?.payUrl && copyToClipboard(qrData.payUrl)}
              style={{ flex: 1, height: 54, backgroundColor: '#ffffff', borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#f1f5f9' }}
            >
              <Copy size={18} color="#64748b" />
              <Text style={{ color: '#64748b', fontFamily: 'Manrope_800ExtraBold', fontSize: 13 }}>Copy Link</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => qrData?.qrCode && shareQR(qrData.qrCode, `Pay ฿${amount || 'any amount'} to ${merchantProfile?.name}\n${qrData?.payUrl}`)}
              style={{ flex: 1, height: 54, backgroundColor: '#ffffff', borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#f1f5f9' }}
            >
              <Share2 size={18} color="#64748b" />
              <Text style={{ color: '#64748b', fontFamily: 'Manrope_800ExtraBold', fontSize: 13 }}>Share QR</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
