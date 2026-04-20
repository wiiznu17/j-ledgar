import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Image as ImageIcon, QrCode, Lightbulb, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { validateAndParseQR, logQRScan, getErrorMessage } from '../../lib/qr-validation';
import { NotificationService } from '../../lib/notification-service';
import { ParsedQR } from '../../lib/qr-parser';

const { width } = Dimensions.get('window');
// คำนวณขนาดกรอบสแกนให้พอดีกับหน้าจอ (70% ของความกว้าง)
const SCAN_FRAME_SIZE = width * 0.72;

// Mock QR codes for testing on simulator
// Note: INTERNAL format only for now, PromptPay requires more complex EMVCo parsing
const MOCK_QR_CODES = [
  'JLEDGER:0812345678', // INTERNAL format: recipient phone
  'JLEDGER:0987654321', // INTERNAL format: another test recipient
];

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();

  const [torch, setTorch] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSimulatorWarning, setShowSimulatorWarning] = useState(false);

  useEffect(() => {
    if (!permission) requestPermission();

    // Log camera status for debugging
    console.log('[Scan] Camera permission status:', permission);

    // Show warning on simulator if not already shown
    if (Platform.OS === 'ios' && Platform.isPad === false) {
      console.log('[Scan] Running on iOS - camera may not work on simulator');
    }
  }, [permission]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || isProcessing) return;
    console.log('[Scan] QR code detected:', data);
    processQRResult(data);
  };

  // For simulator testing only
  const testQRScan = (qrData?: string) => {
    const testData = qrData || MOCK_QR_CODES[0] || 'JLEDGER:0812345678';
    console.log('[Scan] Testing with mock QR:', testData);
    processQRResult(testData);
  };

  const processQRResult = async (rawData: string) => {
    setScanned(true);
    setIsProcessing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Validate and parse QR data
      const validationResult = validateAndParseQR(rawData);

      if (validationResult.success && validationResult.data) {
        // Log successful scan
        await logQRScan({
          timestamp: Date.now(),
          type: validationResult.data.merchantName ? 'PROMPTPAY' : 'INTERNAL',
          recipient: validationResult.data.recipient,
          amount: validationResult.data.amount,
          success: true,
        });

        // Navigate to transfer with validated data
        setTimeout(() => {
          setIsProcessing(false);
          router.push({
            pathname: '/transfer/index',
            params: {
              recipient: validationResult.data!.recipient,
              amount: validationResult.data!.amount || '',
              merchantName: validationResult.data!.merchantName || '',
            },
          } as any);
          setTimeout(() => setScanned(false), 1000);
        }, 500);
      } else {
        // Log failed scan
        await logQRScan({
          timestamp: Date.now(),
          type: 'UNKNOWN',
          success: false,
          error: validationResult.error?.message || 'Unknown error',
        });

        setIsProcessing(false);
        const errorMessage = getErrorMessage(validationResult);

        // Send error notification
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
      await logQRScan({
        timestamp: Date.now(),
        type: 'UNKNOWN',
        success: false,
        error: 'Unexpected error during scan',
      });

      setIsProcessing(false);

      // Send error notification
      NotificationService.info('Scan Error', 'An unexpected error occurred during scanning');

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
          // Attempt to extract QR from image
          // Note: Full implementation requires ML Kit or backend API integration
          if (imageUri) {
            console.log('[Gallery] Selected image:', imageUri);
          }

          setIsProcessing(false);
          Alert.alert(
            'Gallery Scanning',
            'QR code extraction from gallery is coming soon. Please use the camera to scan QR codes for now.',
            [
              {
                text: 'Use Camera',
                onPress: () => {
                  // Return to camera scanning (already active)
                },
              },
              {
                text: 'Dismiss',
              },
            ],
          );
        } catch (error) {
          setIsProcessing(false);
          console.error('[Gallery] Error processing image:', error);
          Alert.alert('Error', 'Failed to process the image. Please try again.', [{ text: 'OK' }]);
        }
      }
    } catch (error) {
      console.error('[Gallery] Error picking image:', error);
      setIsProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#f48fb1" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-[#f8f9fe] items-center justify-center px-10">
        <View className="w-24 h-24 bg-pink-50 rounded-full items-center justify-center mb-6">
          <QrCode size={40} color="#f48fb1" />
        </View>
        <Text className="text-gray-800 text-center text-2xl font-manrope font-black mb-3">
          Camera Access
        </Text>
        <Text className="text-gray-500 text-center text-sm font-manrope font-bold mb-10 leading-relaxed">
          We need access to your camera to scan QR codes for lightning-fast payments.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="w-full bg-[#f48fb1] h-16 rounded-2xl items-center justify-center shadow-lg shadow-pink-200 active:scale-95"
        >
          <Text className="text-white font-manrope font-black text-base">Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-full h-14 mt-4 items-center justify-center active:scale-95"
        >
          <Text className="text-gray-400 font-manrope font-black text-sm">Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black relative">
      {/* iOS Simulator Warning - Camera not supported */}
      {__DEV__ && Platform.OS === 'ios' && !permission?.granted && (
        <View className="absolute top-0 w-full bg-blue-500/90 px-4 py-3 z-30 flex-row items-center gap-2">
          <AlertCircle size={16} color="white" />
          <View className="flex-1">
            <Text className="text-white text-xs font-manrope font-bold">
              💡 iOS Simulator: Use "Test QR" button or test on real device
            </Text>
          </View>
        </View>
      )}

      {/* 1. Camera Layer (ล่างสุด เต็มจอ 100%) */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* 2. Mask Layer (ครอบสีดำ เจาะรูกลางจอ) */}
      <View style={[StyleSheet.absoluteFillObject, { zIndex: 10 }]} pointerEvents="none">
        {/* Top Mask */}
        <View
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' }}
          className="items-center justify-end pb-8"
        >
          <View className="bg-black/60 px-5 py-2.5 rounded-full border border-white/20">
            <Text className="text-white font-manrope font-bold text-xs tracking-widest uppercase">
              Position QR Code in Frame
            </Text>
          </View>
        </View>

        {/* Center Row (ซ้าย - กล่องสแกน - ขวา) */}
        <View className="flex-row" style={{ height: SCAN_FRAME_SIZE }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' }} />

          <View style={{ width: SCAN_FRAME_SIZE, height: SCAN_FRAME_SIZE, position: 'relative' }}>
            {/* กรอบมุมทั้ง 4 ด้าน */}
            <View className="absolute top-0 left-0 w-12 h-12 border-t-[5px] border-l-[5px] border-[#f48fb1] rounded-tl-3xl" />
            <View className="absolute top-0 right-0 w-12 h-12 border-t-[5px] border-r-[5px] border-[#f48fb1] rounded-tr-3xl" />
            <View className="absolute bottom-0 left-0 w-12 h-12 border-b-[5px] border-l-[5px] border-[#f48fb1] rounded-bl-3xl" />
            <View className="absolute bottom-0 right-0 w-12 h-12 border-b-[5px] border-r-[5px] border-[#f48fb1] rounded-br-3xl" />

            {/* เส้นเลเซอร์แสกน */}
            <MotiView
              from={{ translateY: 0 }}
              animate={{ translateY: SCAN_FRAME_SIZE - 4 }}
              transition={{ loop: true, type: 'timing', duration: 2500 }}
              className="absolute left-3 right-3 h-[2px] bg-[#f48fb1] shadow-lg shadow-pink-400 z-10"
            />

            {/* Overlay กำลังประมวลผล (แสดงตอนสแกนติด) */}
            <AnimatePresence>
              {isProcessing && (
                <MotiView
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 rounded-3xl items-center justify-center"
                >
                  <ActivityIndicator size="large" color="#f48fb1" />
                </MotiView>
              )}
            </AnimatePresence>
          </View>

          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' }} />
        </View>

        {/* Bottom Mask */}
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' }} />
      </View>

      {/* 3. Floating Controls Layer (UI ปุ่มกด ลอยเหนือกล้องและ Mask) */}
      <View style={[StyleSheet.absoluteFillObject, { zIndex: 20 }]} pointerEvents="box-none">
        {/* Top Header Buttons (ดันลงมาหลบขอบจอบน) */}
        <View
          className="absolute top-0 w-full flex-row justify-between px-6"
          style={{ paddingTop: Math.max(insets.top, 20) + 10 }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-12 h-12 rounded-[1.2rem] bg-[#1a1a1a]/80 items-center justify-center border border-white/20 active:scale-95"
          >
            <X size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTorch(!torch)}
            className={`w-12 h-12 rounded-[1.2rem] items-center justify-center border border-white/20 active:scale-95 transition-all ${
              torch ? 'bg-[#f48fb1]' : 'bg-[#1a1a1a]/80'
            }`}
          >
            <Lightbulb size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Bottom Menu (ใช้ style bottom ดันขึ้นจากขอบล่างชัดเจน การันตีไม่โดนบัง) */}
        <View
          className="absolute w-full items-center"
          style={{ bottom: Math.max(insets.bottom, 20) + 120 }}
        >
          <View className="flex-row items-center bg-[#1a1a1a]/90 px-8 py-4 rounded-[2rem] border border-white/10 shadow-2xl">
            <TouchableOpacity
              onPress={pickImageFromGallery}
              className="items-center mr-8 active:scale-95"
            >
              <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center mb-1">
                <ImageIcon size={22} color="white" />
              </View>
              <Text className="text-white/90 text-[10px] font-manrope font-bold uppercase tracking-widest mt-1">
                Gallery
              </Text>
            </TouchableOpacity>

            {/* เส้นคั่นกลาง */}
            <View className="w-[1px] h-12 bg-white/20" />

            <TouchableOpacity
              onPress={() => router.push('/my-qr' as any)}
              className="items-center ml-8 active:scale-95"
            >
              <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center mb-1">
                <QrCode size={22} color="white" />
              </View>
              <Text className="text-white/90 text-[10px] font-manrope font-bold uppercase tracking-widest mt-1">
                My QR
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Test QR Button - Simulator Only (positioned higher to avoid tab bar) */}
        {__DEV__ && (
          <View
            className="absolute w-full items-center"
            style={{ bottom: Math.max(insets.bottom, 20) + 200 }}
          >
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Test QR Code', 'Select a test QR code', [
                  {
                    text: 'Test 1: 0812345678',
                    onPress: () => testQRScan(MOCK_QR_CODES[0]),
                  },
                  {
                    text: 'Test 2: 0987654321',
                    onPress: () => testQRScan(MOCK_QR_CODES[1]),
                  },
                  {
                    text: 'Cancel',
                  },
                ]);
              }}
              className="px-4 py-2 rounded-lg bg-blue-500/80 active:scale-95"
            >
              <Text className="text-white text-xs font-manrope font-bold">
                🧪 Test QR (Dev Only)
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
