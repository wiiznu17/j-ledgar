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
        from={{ scale: 0.8 }}
        animate={{ 
          scale: active ? 1.2 : 1,
          backgroundColor: active ? '#f48fb1' : '#E6E8EF'
        }}
        className="w-4 h-4 rounded-full mx-2"
        style={{ backgroundColor: active ? '#f48fb1' : '#E6E8EF' }}
      />
    );
  };

  const renderKey = (val: string | 'back') => (
    <TouchableOpacity
      key={val}
      onPress={() => val === 'back' ? handleBackspace() : handlePress(val)}
      activeOpacity={0.7}
      className={`w-[28%] aspect-[1.2] items-center justify-center rounded-3xl m-[2.5%] ${val === 'back' ? 'bg-transparent' : 'bg-white/40 border border-outline-variant shadow-sm'}`}
    >
      {val === 'back' ? (
        <Delete size={24} color="#595b61" />
      ) : (
        <Text className="text-2xl font-manrope font-extrabold text-on-surface">{val}</Text>
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
      <View className="flex-row flex-wrap justify-center w-full">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => renderKey(num))}
        <TouchableOpacity className="w-[28%] aspect-[1.2] m-[2.5%]" disabled />
        {renderKey('0')}
        {renderKey('back')}
      </View>
    </View>
  );
}
