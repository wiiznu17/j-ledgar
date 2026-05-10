import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { Palette } from '@/constants/theme';

interface PINLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  centerElement?: React.ReactNode;
  iconElement?: React.ReactNode;
}

export const PINLayout: React.FC<PINLayoutProps> = ({
  title,
  subtitle,
  children,
  leftElement,
  rightElement,
  centerElement,
  iconElement,
}) => {
  return (
    <View className="flex-1 w-full">
      {/* Fixed Height Header Area (60px) */}
      <View className="h-[60px] flex-row items-center justify-between px-2">
        <View className="w-12 h-12 items-center justify-center">
          {leftElement}
        </View>

        <View className="flex-1 items-center justify-center">
          {centerElement}
        </View>

        <View className="w-12 h-12 items-center justify-center">
          {rightElement}
        </View>
      </View>

      {/* Title Section */}
      <View className="items-center mt-2 mb-4">
        {iconElement && (
          <View
            style={{ backgroundColor: Palette.primary.container + '40' }} // 40 is hex for 25% opacity
            className="w-16 h-16 rounded-[1.5rem] items-center justify-center mb-4 border border-pink-100 shadow-sm"
          >
            {iconElement}
          </View>
        )}

        <Text
          style={{ color: Palette.text.primary }}
          className="text-2xl font-manrope font-black text-center px-6"
        >
          {title}
        </Text>

        {subtitle && (
          <Text
            style={{ color: Palette.text.secondary }}
            className="text-sm font-manrope font-bold text-center px-10 mt-1 leading-relaxed"
          >
            {subtitle}
          </Text>
        )}
      </View>

      {/* PIN Input / Children Area */}
      <View className="mt-2">{children}</View>
    </View>
  );
};

// Export a standard BackButton to be used in leftElement
export const PINBackButton: React.FC<{ onPress: () => void }> = ({
  onPress,
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center active:bg-gray-100"
  >
    <ChevronLeft size={20} color="#1a1a1a" />
  </TouchableOpacity>
);
