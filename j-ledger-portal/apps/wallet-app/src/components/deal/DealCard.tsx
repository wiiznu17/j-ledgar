import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MotiView } from 'moti';
import { Zap, ArrowRight } from 'lucide-react-native';

interface DealCardProps {
  id: string;
  title: string;
  subtitle: string;
  image: any;
  tag: string;
  points: number;
  onPress: () => void;
  index: number;
}

export const DealCard = ({
  title,
  subtitle,
  image,
  tag,
  points,
  onPress,
  index,
}: DealCardProps) => {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 100 }}
    >
      <TouchableOpacity
        onPress={onPress}
        className="rounded-[2.5rem] overflow-hidden bg-white border border-gray-50 shadow-sm active:scale-[0.98]"
      >
        <Image
          source={typeof image === 'string' ? { uri: image } : image}
          className="w-full h-40"
          resizeMode="cover"
        />
        <View className="absolute top-4 right-4">
          <View className="bg-[#f48fb1] px-3 py-1.5 rounded-xl">
            <Text className="text-white text-[9px] font-manrope font-black uppercase tracking-widest">
              {tag}
            </Text>
          </View>
        </View>

        <View className="p-6">
          <Text className="text-lg font-manrope font-black text-gray-800 mb-1 tracking-tight">
            {title}
          </Text>
          <Text className="text-xs font-manrope font-bold text-gray-400 mb-5 leading-relaxed">
            {subtitle}
          </Text>

          <View className="flex-row items-center justify-between pt-5 border-t border-gray-50">
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-xl bg-pink-50 items-center justify-center">
                <Zap size={14} color="#f48fb1" fill="#f48fb1" />
              </View>
              <View>
                <Text className="text-[9px] font-manrope font-black text-gray-300 uppercase tracking-widest mb-0.5">
                  Price
                </Text>
                <Text className="text-xs font-manrope font-black text-[#f48fb1] uppercase">
                  {points.toLocaleString()} Points
                </Text>
              </View>
            </View>
            <View className="w-10 h-10 bg-gray-50 rounded-2xl items-center justify-center border border-gray-100">
              <ArrowRight size={18} color="#1a1a1a" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
};
