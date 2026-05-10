import React, { useRef, useEffect } from 'react';
import { View, TextInput, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { MotiView } from 'moti';
import { Palette } from '@/constants/theme';

interface PINInputProps {
  pin: string;
  onPinChange: (pin: string) => void;
  length?: number;
  onComplete?: (pin: string) => void;
  autoFocus?: boolean;
}

export const PINInput: React.FC<PINInputProps> = ({
  pin,
  onPinChange,
  length = 6,
  onComplete,
  autoFocus = true,
}) => {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const handleChangeText = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length <= length) {
      onPinChange(cleaned);
      if (cleaned.length === length && onComplete) {
        onComplete(cleaned);
      }
    }
  };

  const renderDot = (index: number) => {
    const isActive = pin.length > index;
    const isCurrent = pin.length === index;

    return (
      <MotiView
        key={index}
        from={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: isActive ? 1.1 : 1,
          opacity: 1,
          backgroundColor: isActive ? Palette.primary.DEFAULT : '#FFFFFF',
          borderColor: Palette.primary.DEFAULT,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className={`w-4 h-4 rounded-full mx-3 border-[1.5px]`}
      />
    );
  };

  return (
    <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
      <View className="items-center justify-center py-6">
        {/* Hidden TextInput */}
        <TextInput
          ref={inputRef}
          value={pin}
          onChangeText={handleChangeText}
          keyboardType="number-pad"
          maxLength={length}
          autoFocus={autoFocus}
          style={{ opacity: 0, height: 1, width: 1, position: 'absolute' }}
          caretHidden
        />

        {/* Visual Dots */}
        <View className="flex-row items-center justify-center">
          {Array.from({ length }).map((_, i) => renderDot(i))}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};
