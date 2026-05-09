import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { X } from 'lucide-react-native';

interface ThaiDatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (dateStr: string) => void;
  initialValue?: string; // DD/MM/YYYY
  title: string;
}

const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

export const ThaiDatePickerModal: React.FC<ThaiDatePickerModalProps> = ({
  visible,
  onClose,
  onSelect,
  initialValue,
  title,
}) => {
  const [day, setDay] = useState(1);
  const [month, setMonth] = useState(0); // 0-indexed
  const [year, setYear] = useState(new Date().getFullYear() + 543);

  useEffect(() => {
    if (visible && initialValue) {
      // Parse DD/MM/YYYY or DD Month YYYY
      const parts = initialValue.split(/[\/\s.]+/).filter(Boolean);
      if (parts.length >= 3) {
        const dStr = parts[0];
        const mStr = parts[1];
        const yStr = parts[2];

        if (dStr) {
          const d = parseInt(dStr);
          if (!isNaN(d)) setDay(d);
        }

        if (mStr) {
          // Month handling
          let mIdx = THAI_MONTHS_SHORT.findIndex((m) => mStr.includes(m));
          if (mIdx === -1) mIdx = THAI_MONTHS.findIndex((m) => mStr.includes(m));
          if (mIdx === -1) {
            const mInt = parseInt(mStr);
            if (!isNaN(mInt)) mIdx = mInt - 1;
          }
          if (mIdx !== -1) setMonth(mIdx);
        }

        if (yStr) {
          // Year handling (Force B.E.)
          let y = parseInt(yStr);
          if (!isNaN(y)) {
            if (y < 2400) y += 543;
            setYear(y);
          }
        }
      }
    }
  }, [visible, initialValue]);

  const handleConfirm = () => {
    const formattedDate = `${day} ${THAI_MONTHS_SHORT[month]} ${year}`;
    onSelect(formattedDate);
    onClose();
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear() + 543;
  const years = Array.from({ length: 120 }, (_, i) => currentYear + 20 - i); // From 20 years in future to 100 years in past

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-white rounded-t-[40px] p-8 pb-12">
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-xl font-manrope font-black text-primary">{title}</Text>
            <TouchableOpacity onPress={onClose} className="p-2 bg-gray-100 rounded-full">
              <X size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View className="flex-row h-64">
            {/* Day Column */}
            <View className="flex-1">
              <Text className="text-center text-xs font-bold text-gray-400 mb-2">วัน</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {days.map((d) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setDay(d)}
                    className={`py-3 items-center ${day === d ? 'bg-primary/10 rounded-xl' : ''}`}
                  >
                    <Text
                      className={`font-manrope ${day === d ? 'text-primary font-black text-lg' : 'text-gray-400'}`}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Month Column */}
            <View className="flex-[2]">
              <Text className="text-center text-xs font-bold text-gray-400 mb-2">เดือน</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {THAI_MONTHS.map((m, i) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMonth(i)}
                    className={`py-3 items-center ${month === i ? 'bg-primary/10 rounded-xl' : ''}`}
                  >
                    <Text
                      className={`font-manrope ${month === i ? 'text-primary font-black text-lg' : 'text-gray-400'}`}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Year Column */}
            <View className="flex-1">
              <Text className="text-center text-xs font-bold text-gray-400 mb-2">ปี พ.ศ.</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {years.map((y) => (
                  <TouchableOpacity
                    key={y}
                    onPress={() => setYear(y)}
                    className={`py-3 items-center ${year === y ? 'bg-primary/10 rounded-xl' : ''}`}
                  >
                    <Text
                      className={`font-manrope ${year === y ? 'text-primary font-black text-lg' : 'text-gray-400'}`}
                    >
                      {y}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleConfirm}
            className="bg-primary py-4 rounded-2xl mt-8 shadow-lg shadow-primary/30"
          >
            <Text className="text-center text-white font-manrope font-black text-lg">ตกลง</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
