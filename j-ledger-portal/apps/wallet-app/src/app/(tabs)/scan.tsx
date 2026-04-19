import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Scan, X, Image as ImageIcon, QrCode, Lightbulb } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function ScanScreen() {
  const router = useRouter();
  const [torch, setTorch] = useState(false);

  return (
    <View className="flex-1 bg-black">
      {/* Mock Camera View */}
      <View className="absolute inset-0 bg-gray-900 overflow-hidden">
        <MotiView 
          from={{ translateY: -height }}
          animate={{ translateY: height }}
          transition={{ duration: 2000, repeat: -1, type: 'timing', easing: Easing.linear }}
          className="absolute w-full h-[2] bg-primary z-10 shadow-lg shadow-primary"
        />
        
        {/* Mock Content */}
        <View className="flex-1 items-center justify-center">
           <Text className="text-white/20 font-manrope font-black text-4xl transform -rotate-45">CAMERA PREVIEW</Text>
        </View>
      </View>

      {/* Overlay Mask */}
      <View style={StyleSheet.absoluteFill} className="items-center justify-center">
        <View className="w-[width] h-[height] absolute bg-black/40" />
        
        {/* Scanning Square */}
        <View className="w-[280] h-[280] bg-transparent relative">
           {/* Corners */}
           <View className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-3xl" />
           <View className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-3xl" />
           <View className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-3xl" />
           <View className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-3xl" />
        </View>
        
        <Text className="text-white/80 font-manrope font-bold text-sm mt-10">Scan QR Code or Barcode</Text>
      </View>

      {/* UI Controls */}
      <SafeAreaView className="flex-1">
        <View className="flex-row justify-between px-6 pt-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-12 h-12 rounded-2xl bg-black/40 border border-white/20 items-center justify-center"
          >
            <X size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setTorch(!torch)}
            className={`w-12 h-12 rounded-2xl ${torch ? 'bg-primary' : 'bg-black/40'} border border-white/20 items-center justify-center`}
          >
            <Lightbulb size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View className="absolute bottom-40 left-0 right-0 items-center">
           <View className="flex-row gap-8 bg-black/60 px-8 py-5 rounded-[30] border border-white/10">
              <TouchableOpacity className="items-center">
                 <View className="w-12 h-12 rounded-2xl bg-white/10 items-center justify-center mb-2">
                    <ImageIcon size={24} color="white" />
                 </View>
                 <Text className="text-white/60 text-[10px] font-manrope font-bold uppercase">Album</Text>
              </TouchableOpacity>
              <TouchableOpacity className="items-center">
                 <View className="w-12 h-12 rounded-2xl bg-white/10 items-center justify-center mb-2">
                    <QrCode size={24} color="white" />
                 </View>
                 <Text className="text-white/60 text-[10px] font-manrope font-bold uppercase">My QR</Text>
              </TouchableOpacity>
           </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
