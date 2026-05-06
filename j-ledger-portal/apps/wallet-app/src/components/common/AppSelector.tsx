import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';

interface AppSelectorProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
  containerClassName?: string;
}

export const AppSelector: React.FC<AppSelectorProps> = ({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select option',
  error,
  containerClassName,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <View className={containerClassName}>
      <Text className="text-[10px] font-manrope font-extrabold text-on-surfaceVariant/50 uppercase tracking-widest mb-2 ml-1">
        {label}
      </Text>
      
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setIsVisible(true)}
        className={`flex-row items-center justify-between px-4 h-16 bg-white/60 rounded-2xl border ${
          error ? 'border-error' : isVisible ? 'border-primary' : 'border-outline-variant'
        } shadow-sm`}
      >
        <Text
          className={`font-manrope text-sm ${
            value ? 'text-on-surface font-bold' : 'text-on-surfaceVariant/40'
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={18} color="#f48fb1" opacity={0.5} />
      </TouchableOpacity>

      {error && (
        <Text className="text-[10px] font-manrope text-error mt-1 ml-1">{error}</Text>
      )}

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsVisible(false)}>
          <View className="flex-1 bg-black/40 justify-end">
            <TouchableWithoutFeedback>
              <MotiView
                from={{ translateY: 300 }}
                animate={{ translateY: 0 }}
                transition={{ type: 'timing', duration: 300 }}
                className="bg-surface rounded-t-[40px] px-6 pb-12 pt-8"
                style={{ maxHeight: '70%' }}
              >
                <View className="w-12 h-1.5 bg-on-surfaceVariant/10 rounded-full self-center mb-8" />
                
                <Text className="text-xl font-manrope font-extrabold text-on-surface mb-6">
                  Select {label}
                </Text>

                <FlatList
                  data={options}
                  keyExtractor={(item) => item.value}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={() => {
                        onSelect(item.value);
                        setIsVisible(false);
                      }}
                      className={`flex-row items-center justify-between py-4 border-b border-on-surfaceVariant/5 ${
                        item.value === value ? 'bg-primary/5 rounded-xl px-4' : 'px-4'
                      }`}
                    >
                      <Text
                        className={`text-base font-manrope ${
                          item.value === value
                            ? 'text-primary font-bold'
                            : 'text-on-surfaceVariant'
                        }`}
                      >
                        {item.label}
                      </Text>
                      {item.value === value && <Check size={20} color="#f48fb1" />}
                    </TouchableOpacity>
                  )}
                />
              </MotiView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};
