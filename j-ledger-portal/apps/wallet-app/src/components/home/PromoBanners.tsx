import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';

interface PromoBannersProps {
  onPromoPress: (id: string) => void;
}

export const PromoBanners = ({ onPromoPress }: PromoBannersProps) => {
  return (
    <View className="mb-4">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
        <TouchableOpacity
          onPress={() => onPromoPress('promo1')}
          className="w-[300] aspect-[21/9] rounded-[2rem] overflow-hidden mr-4 shadow-sm relative"
        >
          <Image
            source={{ uri: 'https://picsum.photos/seed/promo1/600/300' }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/30 p-5 justify-center">
            <View className="bg-[#f48fb1] self-start px-2 py-0.5 rounded mb-2">
              <Text className="text-white text-[8px] font-black tracking-widest uppercase">
                Hot Deals
              </Text>
            </View>
            <Text className="text-white font-manrope font-black text-xl leading-tight">
              Get ฿50 Cashback
            </Text>
            <Text className="text-white/90 font-manrope font-bold text-xs mt-1">
              on your first Bill Pay
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onPromoPress('promo2')}
          className="w-[300] aspect-[21/9] rounded-[2rem] overflow-hidden mr-10 shadow-sm relative"
        >
          <Image
            source={{ uri: 'https://picsum.photos/seed/promo2/600/300' }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/30 p-5 justify-center">
            <View className="bg-blue-500 self-start px-2 py-0.5 rounded mb-2">
              <Text className="text-white text-[8px] font-black tracking-widest uppercase">New</Text>
            </View>
            <Text className="text-white font-manrope font-black text-xl leading-tight">
              Double Points
            </Text>
            <Text className="text-white/90 font-manrope font-bold text-xs mt-1">
              every Friday with Scan & Pay
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
