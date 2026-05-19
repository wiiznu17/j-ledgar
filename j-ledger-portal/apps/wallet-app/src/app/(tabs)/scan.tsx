import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QrCode } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useIsFocused } from '@react-navigation/native';
import {
  validateAndParseQR,
  logQRScan,
  getErrorMessage,
} from '../../lib/qr-validation';
import { NotificationService } from '../../lib/notification-service';

// Import New Components
import { ScannerFrame } from '../../components/scanner/ScannerFrame';
import { ScannerOverlay } from '../../components/scanner/ScannerOverlay';
import { ScannerControls } from '../../components/scanner/ScannerControls';
import { ScannerMenu } from '../../components/scanner/ScannerMenu';

const { width } = Dimensions.get('window');
const SCAN_FRAME_SIZE = width * 0.72;

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();

  const [torch, setTorch] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!permission) requestPermission();

    // If we return to the screen, reset the scanned state
    if (isFocused) {
      setScanned(false);
      setIsProcessing(false);
    }
  }, [permission, isFocused]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!isFocused || scanned || isProcessing) return;
    console.log('[Scan] QR code detected:', data);
    processQRResult(data);
  };

  const processQRResult = async (rawData: string) => {
    setScanned(true);
    setIsProcessing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const validationResult = validateAndParseQR(rawData);

      if (validationResult.success && validationResult.data) {
        await logQRScan({
          timestamp: Date.now(),
          type: 'INTERNAL',
          recipient: validationResult.data.recipient,
          amount: validationResult.data.amount,
          success: true,
        });

        setTimeout(() => {
          setIsProcessing(false);
          const rawData = validationResult.data;
          if (!rawData) return;

          if (rawData.type === 'MERCHANT_PAYMENT') {
            router.push({
              pathname: '/transfer',
              params: { paymentId: rawData.paymentId },
            } as any);
          } else if (rawData.type === 'MERCHANT_STATIC') {
            router.push({
              pathname: '/transfer',
              params: { merchantId: rawData.merchantId },
            } as any);
          } else {
            router.push({
              pathname: '/transfer',
              params: {
                recipient: rawData.recipient,
                amount: rawData.amount || '',
                merchantName: rawData.merchantName || '',
              },
            } as any);
          }
        }, 500);
      } else {
        await logQRScan({
          timestamp: Date.now(),
          type: 'UNKNOWN',
          success: false,
          error: validationResult.error?.message || 'Unknown error',
        });

        setIsProcessing(false);
        const errorMessage = getErrorMessage(validationResult);
        NotificationService.qrInvalid(errorMessage);

        Alert.alert('Invalid QR Code', errorMessage, [
          {
            text: 'Try Again',
            onPress: () => setTimeout(() => setScanned(false), 300),
          },
        ]);
      }
    } catch (error) {
      console.error('[Scan] Unexpected error:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.', [
        {
          text: 'Try Again',
          onPress: () => setTimeout(() => setScanned(false), 300),
        },
      ]);
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsProcessing(true);
        const asset = result.assets[0];
        const imageUri = asset?.uri;

        try {
          if (imageUri) {
            const scanResults = await Camera.scanFromURLAsync(imageUri, ['qr']);
            if (scanResults && scanResults.length > 0 && scanResults[0]) {
              processQRResult(scanResults[0].data);
            } else {
              setIsProcessing(false);
              Alert.alert(
                'No QR Code Found',
                'No QR code was detected in the selected image.',
              );
            }
          }
        } catch (error) {
          setIsProcessing(false);
          Alert.alert('Error', 'Failed to process the image.');
        }
      }
    } catch (error) {
      setIsProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#f48fb1" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-transparent items-center justify-center px-10">
        <View className="w-24 h-24 bg-pink-50 rounded-full items-center justify-center mb-6">
          <QrCode size={40} color="#f48fb1" />
        </View>
        <Text className="text-gray-800 text-center text-2xl font-manrope font-black mb-3">
          Camera Access
        </Text>
        <Text className="text-gray-500 text-center text-sm font-manrope font-bold mb-10 leading-relaxed">
          We need access to your camera to scan QR codes for lightning-fast
          payments.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="w-full bg-[#f48fb1] h-16 rounded-2xl items-center justify-center shadow-lg active:scale-95"
        >
          <Text className="text-white font-manrope font-black text-base">
            Grant Permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black relative">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={
          !isFocused || scanned || isProcessing
            ? undefined
            : handleBarCodeScanned
        }
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      <ScannerOverlay frameSize={SCAN_FRAME_SIZE}>
        <ScannerFrame size={SCAN_FRAME_SIZE} isProcessing={isProcessing} />
      </ScannerOverlay>

      <ScannerControls
        topInset={insets.top}
        torch={torch}
        onClose={() => router.back()}
        onToggleTorch={() => setTorch(!torch)}
      />

      <ScannerMenu
        bottomInset={insets.bottom}
        onPickImage={pickImageFromGallery}
        onShowMyQr={() => router.push('/my-qr' as any)}
      />
    </View>
  );
}
