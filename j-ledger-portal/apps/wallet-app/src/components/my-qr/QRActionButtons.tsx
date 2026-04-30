import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Share2, Download } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { QRCardRef } from './QRCard';

interface QRActionButtonsProps {
  isProcessing?: boolean;
  setIsProcessing?: (val: boolean) => void;
  qrCardRef?: React.RefObject<QRCardRef | null>;
}

export function QRActionButtons({
  isProcessing,
  setIsProcessing,
  qrCardRef,
}: QRActionButtonsProps) {
  const handleShare = async () => {
    if (isProcessing || !qrCardRef?.current) return;
    setIsProcessing?.(true);

    try {
      const uri = await qrCardRef.current.capture();
      if (uri) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Error', 'Failed to capture QR code');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share QR code');
    } finally {
      setIsProcessing?.(false);
    }
  };

  const handleSave = async () => {
    if (isProcessing || !qrCardRef?.current) return;
    setIsProcessing?.(true);

    try {
      const uri = await qrCardRef.current.capture();
      if (uri) {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.createAssetAsync(uri);
          Alert.alert('Success', 'QR code saved to gallery');
        } else {
          Alert.alert('Permission denied', 'Please grant permission to save photos');
        }
      } else {
        Alert.alert('Error', 'Failed to capture QR code');
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save QR code');
    } finally {
      setIsProcessing?.(false);
    }
  };

  return (
    <View className="flex-row gap-4 w-full mb-6">
      <TouchableOpacity
        disabled={isProcessing}
        onPress={handleShare}
        className={`flex-1 h-14 rounded-2xl bg-white border border-gray-100 items-center justify-center flex-row gap-2 shadow-sm active:scale-95 ${isProcessing ? 'opacity-70' : ''}`}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="#f48fb1" />
        ) : (
          <>
            <Share2 size={18} color="#f48fb1" />
            <Text className="text-xs font-manrope font-black text-gray-800 uppercase tracking-widest">
              Share QR
            </Text>
          </>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        disabled={isProcessing}
        onPress={handleSave}
        className={`flex-1 h-14 rounded-2xl bg-white border border-gray-100 items-center justify-center flex-row gap-2 shadow-sm active:scale-95 ${isProcessing ? 'opacity-70' : ''}`}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="#f48fb1" />
        ) : (
          <>
            <Download size={18} color="#f48fb1" />
            <Text className="text-xs font-manrope font-black text-gray-800 uppercase tracking-widest">
              Save Image
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
