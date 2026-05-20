import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';

interface ProcessingPortalProps {
  isVisible: boolean;
  title?: string;
  subtitle?: string;
  accentColor?: string;
}

/**
 * A full-screen overlay for processing transactions.
 * Prevents user interaction while the transaction is being secured.
 */
export const ProcessingPortal: React.FC<ProcessingPortalProps> = ({
  isVisible,
  title = 'Processing Payment',
  subtitle = "We're securing your transaction and confirming with the merchant...",
  accentColor = '#f48fb1',
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 items-center justify-center z-50 p-10"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
        >
          {/* Animated Spinner Container */}
          <MotiView
            from={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-pink-50 rounded-[2.5rem] items-center justify-center border border-pink-100 mb-8"
            style={{
              shadowColor: accentColor,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 5,
            }}
          >
            <ActivityIndicator size="large" color={accentColor} />
          </MotiView>

          <Text className="text-2xl font-manrope font-black text-gray-800 tracking-tight text-center">
            {title}
          </Text>
          <Text className="text-sm font-manrope font-bold text-gray-400 mt-3 text-center leading-relaxed">
            {subtitle}
          </Text>
        </MotiView>
      )}
    </AnimatePresence>
  );
};
