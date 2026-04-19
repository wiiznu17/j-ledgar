import React from 'react';
import { View, Text, Image } from 'react-native';
import { MotiView } from 'moti';

interface WelcomeHeaderProps {
  user: {
    name: string;
    avatar: any;
  };
}

export const WelcomeHeader = ({ user }: WelcomeHeaderProps) => {
  return (
    <MotiView
      from={{ opacity: 0, translateX: -10 }}
      animate={{ opacity: 1, translateX: 0 }}
      className="flex-row items-center justify-between mb-4"
    >
      <View className="flex-row items-center gap-3">
        <Image source={user.avatar} className="w-12 h-12 rounded-full border-2 border-[#f48fb1]" />
        <View>
          <Text className="text-xs font-manrope font-bold text-gray-400">Hello,</Text>
          <Text className="text-lg font-manrope font-black text-gray-800 tracking-tight">
            {user.name}
          </Text>
        </View>
      </View>
    </MotiView>
  );
};
