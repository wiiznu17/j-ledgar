import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Delete } from 'lucide-react-native';
import { MotiView } from 'moti';

interface PinPadProps {
  pin: string;
  setPin: (pin: string) => void;
  length?: number;
  onComplete?: (pin: string) => void;
}

export function PinPad({ pin, setPin, length = 6, onComplete }: PinPadProps) {
  const handlePress = (num: string) => {
    if (pin.length < length) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === length && onComplete) {
        onComplete(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const renderDot = (index: number) => {
    const active = pin.length > index;
    return (
      <MotiView
        key={index}
        from={{ scale: 1 }}
        animate={{ scale: active ? 1.2 : 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className={`w-5 h-5 rounded-full mx-3 border-2 ${
          active ? 'bg-[#f48fb1] border-[#f48fb1]' : 'bg-transparent border-[#E6E8EF]'
        }`}
      />
    );
  };

  const renderKey = (val: string | 'back') => (
    <TouchableOpacity
      key={val}
      onPress={() => (val === 'back' ? handleBackspace() : handlePress(val))}
      activeOpacity={0.7}
      className={`w-[26%] aspect-[1.1] items-center justify-center rounded-[2rem] m-[3%] ${
        val === 'back' ? 'bg-transparent' : 'bg-white/50 border border-outline-variant shadow-sm'
      }`}
    >
      {val === 'back' ? (
        <Delete size={26} color="#595b61" />
      ) : (
        <Text className="text-3xl font-manrope font-black text-on-surface">{val}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View className="w-full items-center">
      {/* PIN Dots */}
      <View className="flex-row items-center justify-center mb-16">
        {Array.from({ length }).map((_, i) => renderDot(i))}
      </View>

      {/* Keyboard Grid */}
      <View className="flex-row flex-wrap justify-center w-[90%]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => renderKey(num))}
        <View className="w-[26%] aspect-[1.1] m-[3%]" />
        {renderKey('0')}
        {renderKey('back')}
      </View>
    </View>
  );
}
