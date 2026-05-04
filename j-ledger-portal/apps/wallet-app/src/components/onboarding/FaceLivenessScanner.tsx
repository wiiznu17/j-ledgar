import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { MotiView, MotiText } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface FaceLivenessScannerProps {
  onComplete: (uri: string) => void;
  onError: (error: Error) => void;
  onCancel: () => void;
}

export const FaceLivenessScanner: React.FC<FaceLivenessScannerProps> = ({
  onComplete,
  onError,
  onCancel,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [status, setStatus] = useState('Position your face');
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    requestPermission();
  }, []);

  if (!permission) return <View className="flex-1 bg-black" />;
  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center p-6">
        <Text className="text-white text-center mb-6">Camera permission is required for face verification</Text>
        <TouchableOpacity onPress={requestPermission} className="bg-primary px-6 py-3 rounded-full">
          <Text className="text-white font-bold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;
    
    setIsCapturing(true);
    setStatus('Verifying...');
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });
      
      // We pass the URI back to the parent to upload
      onComplete(photo.uri);
    } catch (err: any) {
      onError(err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <View style={StyleSheet.absoluteFill} className="bg-black">
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
      >
        {/* Overlay with Circular Cutout */}
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} className="p-2">
              <Ionicons name="close" size={32} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold ml-4">Face Verification</Text>
          </View>

          <View style={styles.scannerContainer}>
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 1000 }}
              style={styles.circleFrame}
            >
              <View style={styles.innerCircle} />
            </MotiView>
            
            <MotiText
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              className="text-white text-center mt-8 font-manrope font-bold text-lg"
            >
              {status}
            </MotiText>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={takePicture}
              disabled={isCapturing}
              style={styles.captureButton}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>
            <Text className="text-white/60 text-center mt-4">
              Ensure your face is well-lit and fits inside the circle
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const { width } = Dimensions.get('window');
const circleSize = width * 0.7;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scannerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleFrame: {
    width: circleSize,
    height: circleSize,
    borderRadius: circleSize / 2,
    borderWidth: 4,
    borderColor: '#00E676',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: circleSize - 10,
    height: circleSize - 10,
    borderRadius: (circleSize - 10) / 2,
    backgroundColor: 'transparent',
  },
  footer: {
    paddingBottom: 60,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
});
