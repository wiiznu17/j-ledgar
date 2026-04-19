import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, Platform } from 'react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AppButtonProps {
  onPress?: () => void;
  title: string;
  variant?: 'primary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function AppButton({
  onPress,
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  className,
  containerClassName,
  icon,
  iconPosition = 'right',
}: AppButtonProps) {
  const baseStyles = 'h-16 rounded-2xl flex-row items-center justify-center px-6 transition-all';
  const variantStyles = {
    primary: 'bg-primary shadow-xl shadow-primary/20',
    outline: 'bg-white border border-primary/20 shadow-sm',
    ghost: 'bg-transparent',
  };
  const textStyles = {
    primary: 'text-on-primary font-manrope font-extrabold text-lg',
    outline: 'text-primary font-manrope font-extrabold text-lg',
    ghost: 'text-on-surface-variant font-manrope font-bold text-sm',
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onPress?.();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      className={cn(
        baseStyles,
        variantStyles[variant],
        (disabled || loading) && 'opacity-50',
        'active:scale-95',
        className,
        containerClassName,
      )}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : '#f48fb1'} />
      ) : (
        <View className="flex-row items-center justify-center gap-2">
          {icon && iconPosition === 'left' && icon}
          <Text className={textStyles[variant]}>{title}</Text>
          {icon && iconPosition === 'right' && icon}
        </View>
      )}
    </TouchableOpacity>
  );
}
