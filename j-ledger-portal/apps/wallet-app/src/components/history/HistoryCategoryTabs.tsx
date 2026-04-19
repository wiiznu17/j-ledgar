import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';

interface HistoryCategoryTabsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const HistoryCategoryTabs = ({
  categories,
  selectedCategory,
  onSelectCategory,
}: HistoryCategoryTabsProps) => {
  return (
    <View className="mb-6">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 1, gap: 10 }}
      >
        {categories.map((cat) => (
          <TouchableOpacity key={cat} onPress={() => onSelectCategory(cat)}>
            <MotiView
              animate={{
                backgroundColor: selectedCategory === cat ? '#f48fb1' : '#ffffff',
                borderColor: selectedCategory === cat ? '#f48fb1' : '#f3f4f6',
              }}
              className="px-6 py-2.5 rounded-full border shadow-sm"
            >
              <Text
                className={`font-manrope font-black text-[11px] uppercase tracking-widest ${selectedCategory === cat ? 'text-white' : 'text-gray-400'}`}
              >
                {cat}
              </Text>
            </MotiView>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
