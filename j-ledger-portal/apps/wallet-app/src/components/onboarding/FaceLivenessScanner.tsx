import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Image } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { MotiView, MotiText } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Svg, { Path, G } from 'react-native-svg';

interface FaceLivenessScannerProps {
  onComplete: (uri: string) => void;
  onError: (error: Error) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const FaceLivenessScanner: React.FC<FaceLivenessScannerProps> = ({
  onComplete,
  onError,
  onCancel,
  isLoading,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [status, setStatus] = useState('Position your face');
  const cameraRef = useRef<any>(null);

  const processing = isLoading || isCapturing;

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
    if (!cameraRef.current || processing) return;
    
    setIsCapturing(true);
    setStatus('Verifying...');
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });
      
      setCapturedUri(photo.uri);
      onComplete(photo.uri);
    } catch (err: any) {
      onError(err);
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
              style={styles.faceFrameContainer}
            >
              <Svg width={ellipseWidth} height={ellipseHeight} viewBox={`0 0 ${ellipseWidth} ${ellipseHeight}`}>
                {/* Outer Glow/Border Path - Rounder Chin */}
                <Path
                  d={`
                    M ${ellipseWidth / 2} 0
                    C ${ellipseWidth * 0.85} 0, ${ellipseWidth} ${ellipseHeight * 0.3}, ${ellipseWidth} ${ellipseHeight * 0.5}
                    C ${ellipseWidth} ${ellipseHeight * 0.85}, ${ellipseWidth * 0.75} ${ellipseHeight}, ${ellipseWidth / 2} ${ellipseHeight}
                    C ${ellipseWidth * 0.25} ${ellipseHeight}, 0 ${ellipseHeight * 0.85}, 0 ${ellipseHeight * 0.5}
                    C 0 ${ellipseHeight * 0.3}, ${ellipseWidth * 0.15} 0, ${ellipseWidth / 2} 0
                  `}
                  fill="none"
                  stroke="#00E676"
                  strokeWidth="4"
                  strokeDasharray="8 6"
                />
                
                {/* Subtle Face Silhouette Guide */}
                <G opacity="0.2">
                   <Path
                    d={`
                      M ${ellipseWidth * 0.3} ${ellipseHeight * 0.35} Q ${ellipseWidth * 0.35} ${ellipseHeight * 0.32} ${ellipseWidth * 0.4} ${ellipseHeight * 0.35}
                      M ${ellipseWidth * 0.6} ${ellipseHeight * 0.35} Q ${ellipseWidth * 0.65} ${ellipseHeight * 0.32} ${ellipseWidth * 0.7} ${ellipseHeight * 0.35}
                      M ${ellipseWidth * 0.5} ${ellipseHeight * 0.45} L ${ellipseWidth * 0.5} ${ellipseHeight * 0.6} L ${ellipseWidth * 0.45} ${ellipseHeight * 0.65}
                      M ${ellipseWidth * 0.4} ${ellipseHeight * 0.75} Q ${ellipseWidth * 0.5} ${ellipseHeight * 0.8} ${ellipseWidth * 0.6} ${ellipseHeight * 0.75}
                    `}
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                  />
                </G>
              </Svg>
            </MotiView>
            
            <MotiText
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              className="text-white text-center mt-12 font-manrope font-bold text-lg"
            >
              {status}
            </MotiText>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={takePicture}
              disabled={processing}
              style={[styles.captureButton, processing && { borderColor: 'gray' }]}
            >
              <View style={[styles.captureInner, processing && { backgroundColor: 'gray' }]} />
            </TouchableOpacity>
            <Text className="text-white/60 text-center mt-4">
              Ensure your face is well-lit and fits inside the circle
            </Text>
          </View>
        </View>

        {/* Processing Overlay with Captured Face */}
        {processing && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'black', zIndex: 999 }]}>
            {capturedUri && (
              <Image 
                source={{ uri: capturedUri }} 
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            )}
            <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark">
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#00E676" />
                <Text className="text-white font-manrope font-bold text-xl mt-6">
                  Verifying Identity...
                </Text>
                <Text className="text-white/60 text-sm mt-2">
                  Please wait a moment
                </Text>
              </View>
            </BlurView>
          </View>
        )}
      </CameraView>
    </View>
  );
};

const { width } = Dimensions.get('window');
const ellipseWidth = width * 0.65;
const ellipseHeight = ellipseWidth * 1.3;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
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
  faceFrameContainer: {
    width: ellipseWidth,
    height: ellipseHeight,
    alignItems: 'center',
    justifyContent: 'center',
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
