import React from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AppTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function AppTextInput({
  label,
  error,
  containerClassName,
  leftElement,
  rightElement,
  className,
  ...props
}: AppTextInputProps) {
  return (
    <View className={cn('space-y-2', containerClassName)}>
      {label && (
        <Text className="text-[10px] font-manrope font-extrabold uppercase tracking-widest text-on-surfaceVariant px-1 mb-1">
          {label}
        </Text>
      )}
      <View
        className={cn(
          'flex-row items-center bg-white/60 border border-outline-variant rounded-2xl h-16 px-4 shadow-sm',
          error && 'border-red-500',
          props.multiline && 'h-auto py-4 min-h-[100px]',
        )}
      >
        {leftElement && <View className="mr-3">{leftElement}</View>}
        <TextInput
          className={cn('flex-1 font-manrope font-extrabold text-lg text-on-surface', className)}
          placeholderTextColor="#595b6180"
          {...props}
        />
        {rightElement && <View className="ml-3">{rightElement}</View>}
      </View>
      {error && (
        <Text className="text-red-500 text-xs font-manrope font-bold px-1 mt-1">{error}</Text>
      )}
    </View>
  );
}
