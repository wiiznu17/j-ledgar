import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// ขนาดของกรอบบัตร (อัตราส่วนมาตรฐาน ID Card คือประมาณ 1.6:1)
const FRAME_WIDTH = width * 0.9;
const FRAME_HEIGHT = FRAME_WIDTH / 1.58;

interface IDCardScannerProps {
  onCapture: (uri: string) => void;
  onClose: () => void;
  isLoading?: boolean; // เพิ่ม prop นี้เพื่อให้หน้าบ้านควบคุมการหมุนได้
}

export const IDCardScanner: React.FC<IDCardScannerProps> = ({ onCapture, onClose, isLoading }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false); // เปลี่ยนชื่อเพื่อไม่ให้สับสน
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);

  const processing = isLoading || isCapturing;

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.text}>ต้องการสิทธิ์การเข้าถึงกล้องเพื่อถ่ายรูปบัตร</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>อนุญาตการเข้าถึง</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current && !processing) {
      try {
        setIsCapturing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1.0, // เพิ่มคุณภาพสูงสุดเพื่อ OCR
          base64: false,
        });

        setCapturedUri(photo.uri); // Store for preview while processing

        // --- Improved Cropping Logic (Precision Fix) ---
        const photoWidth = photo.width;
        const photoHeight = photo.height;

        // We assume the camera preview fills the screen width.
        // So the scale should be uniform based on width to avoid distortion.
        const scale = photoWidth / width;

        // Calculate crop dimensions using the uniform scale
        const cropWidth = FRAME_WIDTH * scale;
        const cropHeight = FRAME_HEIGHT * scale;

        // Calculate crop position based on the center of the photo
        // (Assuming the camera preview is centered)
        const cropX = (photoWidth - cropWidth) / 2;
        const cropY = (photoHeight - cropHeight) / 2;

        const manipulated = await ImageManipulator.manipulateAsync(
          photo.uri,
          [
            {
              crop: {
                originX: Math.max(0, Math.floor(cropX)),
                originY: Math.max(0, Math.floor(cropY)),
                width: Math.floor(cropWidth),
                height: Math.floor(cropHeight),
              },
            },
          ],
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
        );

        setCapturedUri(manipulated.uri); // Update with cropped version

        // Give the camera a moment to finish its internal tasks before unmounting
        setTimeout(() => {
          onCapture(manipulated.uri);
          setIsCapturing(false);
        }, 100);
      } catch (err) {
        console.error('Failed to take picture:', err);
        setIsCapturing(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef}>
        <View style={styles.overlay}>
          <View style={styles.topOverlay} />
          <View style={styles.middleContainer}>
            <View style={styles.sideOverlay} />
            <View style={styles.frame}>
              {/* Show captured image inside the frame when processing */}
              {processing && capturedUri && (
                <Image
                  source={{ uri: capturedUri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              )}

              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {/* Internal Spinner inside frame */}
              {processing && (
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      justifyContent: 'center',
                      alignItems: 'center',
                    },
                  ]}
                >
                  <ActivityIndicator size="large" color="#00E676" />
                </View>
              )}
            </View>
            <View style={styles.sideOverlay} />
          </View>
          <View style={styles.bottomOverlay}>
            <Text style={styles.guideText}>
              {processing ? 'กำลังประมวลผลรูปภาพ...' : 'วางบัตรประชาชนให้อยู่ในกรอบ'}
            </Text>
          </View>
        </View>

        {/* Global Text Overlay (Optional, can keep or remove) */}
        {processing && (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: 'transparent',
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingBottom: 150,
              },
            ]}
          >
            <Text className="text-white font-manrope font-bold text-xl tracking-wider shadow-lg">
              Scanning ID Card...
            </Text>
          </View>
        )}
      </CameraView>
      <View style={styles.controls}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={processing}>
          <Ionicons name="close" size={32} color={processing ? 'gray' : 'white'} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={takePicture}
          style={[styles.captureButton, processing && { borderColor: 'gray' }]}
          disabled={processing}
        >
          <View style={[styles.captureInner, processing && { backgroundColor: 'gray' }]} />
        </TouchableOpacity>
        <View style={{ width: 32 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'transparent' },
  topOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    paddingTop: 20,
  },
  middleContainer: { height: FRAME_HEIGHT, flexDirection: 'row' },
  sideOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  frame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    borderWidth: 0,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#00E676',
    borderWidth: 4,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  guideText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  controls: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'white',
  },
  closeButton: { padding: 10 },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  button: { backgroundColor: '#2196F3', padding: 15, borderRadius: 10 },
  buttonText: { color: 'white', fontWeight: 'bold' },
});
