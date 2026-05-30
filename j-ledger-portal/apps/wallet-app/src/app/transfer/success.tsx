import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share as RNShare,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { InvoiceView } from '@/components/billing/InvoiceView';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { Download, Share2, Home, CheckCircle2, Heart } from 'lucide-react-native';
import { MotiView } from 'moti';

export default function TransferSuccessScreen() {
  const router = useRouter();
  const { transactionId, recipient, recipientName, merchantName } = useLocalSearchParams<any>();
  const viewShotRef = useRef<ViewShot>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);

  // Auto-trigger Haptic Success Feedback on mount
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  // Fetch the full database Invoice record for accurate E-Slip rendering
  const {
    data: invoice,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['invoice', transactionId],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/billing/invoices/${transactionId}`);
        return data;
      } catch (err: any) {
        throw err;
      }
    },
    enabled: !!transactionId,
  });

  const handleSaveToGallery = async () => {
    try {
      setIsSaving(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your gallery to save the receipt.',
        );
        return;
      }

      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        await MediaLibrary.saveToLibraryAsync(uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'E-Slip saved to your gallery!');
      }
    } catch (error) {
      console.error('Failed to save receipt:', error);
      Alert.alert('Error', 'Failed to save E-Slip to gallery.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        await RNShare.share({
          url: uri,
          message: `P-wallet E-Slip: ${invoice?.invoiceNumber || 'Transfer Slip'}`,
        });
      }
    } catch (error) {
      console.error('Failed to share receipt:', error);
    }
  };

  const handleSaveFavorite = async () => {
    try {
      setIsSavingFavorite(true);
      await api.post('/api/v1/integration/p2p/favorites', {
        recipientPhone: recipient,
        nickname: recipientName,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Added to your favorites!');
    } catch (error) {
      console.error('Failed to save favorite:', error);
      Alert.alert('Error', 'Failed to add favorite.');
    } finally {
      setIsSavingFavorite(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#f8f9fe] items-center justify-center">
        <MotiView
          from={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring' }}
          className="items-center justify-center"
        >
          <ActivityIndicator size="large" color="#f48fb1" />
          <Text className="font-manrope font-black text-gray-500 mt-4 tracking-tight">
            Generating your E-Slip...
          </Text>
        </MotiView>
      </SafeAreaView>
    );
  }

  if (isError || !invoice) {
    return (
      <SafeAreaView className="flex-1 bg-[#f8f9fe] items-center justify-center p-6">
        <Text className="text-xl font-manrope font-black text-gray-800">
          Transfer Receipt Not Found
        </Text>
        <Text className="text-sm font-manrope font-bold text-gray-400 mt-2 text-center">
          The transaction succeeded, but we couldn't load the E-Slip data.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          className="mt-8 px-10 py-4 bg-[#f48fb1] rounded-2xl shadow-lg"
        >
          <Text className="font-manrope font-black text-white">
            Back to Home
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 60,
        }}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 450 }}
        >
          {/* Capture Box */}
          <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
            <InvoiceView invoice={invoice} />
          </ViewShot>

          {/* Action Buttons */}
          <View className="mt-8 gap-4">
            <TouchableOpacity
              onPress={handleSaveToGallery}
              disabled={isSaving}
              activeOpacity={0.8}
              className="w-full h-16 bg-[#1a1a1a] rounded-2xl flex-row items-center justify-center gap-3 shadow-xl active:scale-95"
            >
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Download size={20} color="white" />
                  <Text className="text-sm font-manrope font-black text-white uppercase tracking-widest">
                    Save to Gallery
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.7}
              className="w-full h-16 bg-white border border-gray-100 rounded-2xl flex-row items-center justify-center gap-3 active:scale-95"
            >
              <Share2 size={20} color="#1a1a1a" />
              <Text className="text-sm font-manrope font-black text-gray-800 uppercase tracking-widest">
                Share E-Slip
              </Text>
            </TouchableOpacity>

            {!merchantName && recipient && (
              <TouchableOpacity
                onPress={handleSaveFavorite}
                disabled={isSavingFavorite}
                activeOpacity={0.7}
                className="w-full h-16 bg-purple-50 border border-purple-100 rounded-2xl flex-row items-center justify-center gap-2 active:scale-95"
              >
                {isSavingFavorite ? (
                  <ActivityIndicator color="#a855f7" />
                ) : (
                  <>
                    <Heart size={18} color="#a855f7" fill="#a855f7" />
                    <Text className="text-sm font-manrope font-black text-[#a855f7] uppercase tracking-widest">
                      Save as Favorite
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => router.replace('/(tabs)')}
              activeOpacity={0.7}
              className="w-full h-16 bg-pink-50 border border-pink-100 rounded-2xl flex-row items-center justify-center gap-2 active:scale-95"
            >
              <Home size={18} color="#f48fb1" />
              <Text className="text-sm font-manrope font-black text-[#f48fb1] uppercase tracking-widest">
                Back to Home
              </Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}
