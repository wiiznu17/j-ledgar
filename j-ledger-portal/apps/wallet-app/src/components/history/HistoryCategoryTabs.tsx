import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import type { HistoryFilter } from '@/features/history/presentation';

interface HistoryCategoryTabsProps {
  categories: HistoryFilter[];
  selectedCategory: HistoryFilter['key'];
  onSelectCategory: (category: HistoryFilter['key']) => void;
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
        {categories.map((cat) => {
          const Icon = cat.icon;
          const selected = selectedCategory === cat.key;
          return (
          <TouchableOpacity key={cat.key} onPress={() => onSelectCategory(cat.key)}>
            <MotiView
              animate={{
                backgroundColor: selected ? '#f48fb1' : '#ffffff',
                borderColor: selected ? '#f48fb1' : '#f3f4f6',
              }}
              className="px-4 py-2.5 rounded-full border shadow-sm flex-row items-center gap-2"
            >
              <Icon size={14} color={selected ? '#ffffff' : '#9ca3af'} />
              <Text
                className={`font-manrope font-black text-[11px] uppercase tracking-widest ${selected ? 'text-white' : 'text-gray-400'}`}
              >
                {cat.label}
              </Text>
            </MotiView>
          </TouchableOpacity>
        )})}
      </ScrollView>
    </View>
  );
};
