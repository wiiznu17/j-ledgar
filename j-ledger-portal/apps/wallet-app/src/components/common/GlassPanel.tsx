import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassPanelProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

export function GlassPanel({
  children,
  className,
  intensity = 40,
  tint = 'light',
  ...props
}: GlassPanelProps) {
  return (
    <View
      className={cn(
        'overflow-hidden rounded-3xl border border-outline-variant bg-white/40',
        className,
      )}
      {...props}
    >
      <BlurView intensity={intensity} tint={tint} className="w-full h-full p-6">
        {children}
      </BlurView>
    </View>
  );
}
