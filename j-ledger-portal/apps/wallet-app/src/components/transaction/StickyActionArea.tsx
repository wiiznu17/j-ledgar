import React from 'react';
import { View, Pressable, Text, ActivityIndicator, Platform } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { MotiView } from 'moti';

interface StickyActionAreaProps {
  isVisible?: boolean;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  isAuthenticating?: boolean;
  accentColor?: string;
  showIcon?: boolean;
}

export const StickyActionArea: React.FC<StickyActionAreaProps> = ({
  isVisible = true,
  label,
  onPress,
  disabled = false,
  isLoading = false,
  isAuthenticating = false,
  accentColor = '#f48fb1',
  showIcon = true,
}) => {
  const isInteractionDisabled = disabled || isLoading || isAuthenticating;

  return (
    <MotiView
      from={{ translateY: 150, opacity: 0 }}
      animate={{ 
        translateY: isVisible ? 0 : 150,
        opacity: isVisible ? 1 : 0 
      }}
      transition={{ type: 'timing', duration: 300 }}
      className="absolute bottom-0 left-0 right-0 z-30"
      style={{ 
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderTopWidth: 1,
        borderTopColor: '#f9fafb',
      }}
    >
      <Pressable
        disabled={isInteractionDisabled}
        onPress={onPress}
      >
        {({ pressed }) => (
          <View
            style={{
              backgroundColor: isInteractionDisabled ? '#fbcfe8' : accentColor,
              height: 60,
              borderRadius: 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              opacity: pressed && !isInteractionDisabled ? 0.8 : 1,
              transform: [{ scale: pressed && !isInteractionDisabled ? 0.98 : 1 }],
              // Shadow
              shadowColor: accentColor,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 5
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text className="font-manrope font-black text-white text-base">
                  {isAuthenticating ? 'Authenticating...' : label}
                </Text>
                {showIcon && !isAuthenticating && (
                  <ArrowRight size={20} color="white" />
                )}
              </>
            )}
          </View>
        )}
      </Pressable>
    </MotiView>
  );
};
