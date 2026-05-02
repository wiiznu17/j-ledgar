import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  actionPath?: string;
  priority: number;
}

interface PromoBannersProps {
  banners: Banner[];
  onPromoPress: (path: string) => void;
}

export const PromoBanners = ({ banners, onPromoPress }: PromoBannersProps) => {
  if (!banners || banners.length === 0) return null;

  return (
    <View className="mb-4">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
        {banners.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            onPress={() => banner.actionPath && onPromoPress(banner.actionPath)}
            className="w-[300] aspect-[21/9] rounded-[2.5rem] overflow-hidden mr-4 shadow-sm relative"
          >
            <Image
              source={{ uri: banner.imageUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-black/20 p-6 justify-end">
              <View className="bg-[#f48fb1] self-start px-3 py-1 rounded-xl mb-2">
                <Text className="text-white text-[8px] font-black tracking-widest uppercase">
                  Featured
                </Text>
              </View>
              <Text className="text-white font-manrope font-black text-xl leading-tight">
                {banner.title}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
