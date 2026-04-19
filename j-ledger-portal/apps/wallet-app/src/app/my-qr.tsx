import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Share2,
  Download,
  Copy,
  Info,
  Zap,
  Scan,
  X,
  Check,
  Coins,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Svg, Polyline } from 'react-native-svg';

const { width } = Dimensions.get('window');

const MOCK_USER = {
  name: 'SOMCHAI DEEJA',
  walletId: 'JLED-9922-0051',
  avatar: require('../../assets/images/mock_user_avatar.png'),
};

export default function MyQrScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tempAmount, setTempAmount] = useState('');

  // สร้างข้อมูลสำหรับ QR Code โดยแนบจำนวนเงินเข้าไปถ้ามีการระบุ
  const qrData =
    amount && parseFloat(amount) > 0
      ? `${MOCK_USER.walletId}?amount=${amount}`
      : MOCK_USER.walletId;

  // ใช้สีเทาเข้ม (1a1a1a) เพื่อให้กล้องอ่าน QR ได้ง่ายขึ้น
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}&color=1a1a1a&bgcolor=f8f9fe`;

  const handleSetAmount = () => {
    setAmount(tempAmount);
    setIsModalVisible(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm"
        >
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text className="text-lg font-manrope font-black text-gray-800 tracking-tight">
          Receive Assets
        </Text>
        <TouchableOpacity className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
          <Scan size={20} color="#f48fb1" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          className="mt-2"
        >
          {/* QR Card */}
          <View className="w-full bg-white rounded-[2.5rem] p-8 items-center mb-6 shadow-xl shadow-pink-100 border border-gray-50">
            <View className="relative mb-5">
              <View className="p-1 border-2 border-pink-100 rounded-[1.8rem]">
                <Image source={MOCK_USER.avatar} className="w-16 h-16 rounded-[1.5rem]" />
              </View>
              <View className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white items-center justify-center shadow-sm">
                <CheckIcon size={12} color="white" strokeWidth={3} />
              </View>
            </View>

            <Text className="text-xl font-manrope font-black text-gray-800 mb-1 tracking-tight">
              {MOCK_USER.name}
            </Text>
            <View className="flex-row items-center gap-2 mb-8">
              <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-[0.2em]">
                {MOCK_USER.walletId}
              </Text>
              <TouchableOpacity className="bg-pink-50 px-2 py-1.5 rounded-lg border border-pink-100">
                <Copy size={12} color="#f48fb1" />
              </TouchableOpacity>
            </View>

            {/* QR Code Container */}
            <View className="w-64 h-64 bg-[#f8f9fe] rounded-[2.5rem] items-center justify-center p-6 shadow-inner border border-gray-100 relative">
              <Image source={{ uri: qrUrl }} className="w-full h-full" resizeMode="contain" />
              {/* Logo Overlay */}
              <View className="absolute bg-white p-2 rounded-2xl shadow-md border border-gray-50">
                <View className="w-8 h-8 rounded-xl bg-[#f48fb1] items-center justify-center">
                  <Zap size={16} color="white" fill="white" />
                </View>
              </View>
            </View>

            {amount ? (
              <View className="mt-8 px-5 py-2.5 bg-pink-50 rounded-2xl border border-pink-100 flex-row items-center gap-2">
                <Coins size={14} color="#f48fb1" />
                <Text className="text-[14px] font-manrope font-black text-[#f48fb1]">
                  Amount: ฿{amount.replace(/\B(?=(\d{3})+(?!\d))/g, ', ')}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Trigger Button */}
          <TouchableOpacity
            onPress={() => {
              setTempAmount(amount);
              setIsModalVisible(true);
            }}
            className="w-full h-16 bg-white rounded-3xl border border-gray-100 shadow-sm flex-row items-center px-6 mb-6 active:scale-95"
          >
            <View className="w-10 h-10 bg-pink-50 rounded-xl items-center justify-center border border-pink-100 mr-4">
              <Coins size={20} color="#f48fb1" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-manrope font-black text-gray-800">Specify Amount</Text>
              <Text className="text-[10px] font-manrope font-bold text-gray-400">
                {amount ? 'Tap to change amount' : 'Create a QR for a specific amount'}
              </Text>
            </View>
            <View className="bg-pink-50/50 px-3 py-1 rounded-lg">
              <Text className="text-[10px] font-manrope font-black text-[#f48fb1] uppercase">
                {amount ? 'EDIT' : 'ADD'}
              </Text>
            </View>
          </TouchableOpacity>
        </MotiView>

        {/* Action Buttons */}
        <View className="flex-row gap-4 w-full mb-6">
          <TouchableOpacity className="flex-1 h-14 rounded-2xl bg-white border border-gray-100 items-center justify-center flex-row gap-2 shadow-sm active:scale-95">
            <Share2 size={18} color="#f48fb1" />
            <Text className="text-xs font-manrope font-black text-gray-800 uppercase tracking-widest">
              Share QR
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 h-14 rounded-2xl bg-white border border-gray-100 items-center justify-center flex-row gap-2 shadow-sm active:scale-95">
            <Download size={18} color="#f48fb1" />
            <Text className="text-xs font-manrope font-black text-gray-800 uppercase tracking-widest">
              Save Image
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        <View className="bg-white rounded-2xl p-5 flex-row items-center gap-4 border border-gray-50 shadow-sm mb-10">
          <View className="w-10 h-10 bg-pink-50 rounded-xl items-center justify-center border border-pink-100">
            <Info size={20} color="#f48fb1" />
          </View>
          <Text className="text-[10px] font-manrope font-bold text-gray-500 leading-relaxed flex-1">
            Your unique J-Ledger ID allows instant peer-to-peer asset transfers. Scanning this QR
            will autofill your details.
          </Text>
        </View>
      </ScrollView>

      {/* Amount Modal */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
        >
          {/* Backdrop */}
          <View className="absolute inset-0 bg-black/40" />
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setIsModalVisible(false)}
            className="absolute inset-0"
          />

          {/* Sheet */}
          <MotiView
            from={{ translateY: 400 }}
            animate={{ translateY: isModalVisible ? 0 : 400 }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 200,
              overshootClamping: true,
            }}
            className="bg-white rounded-t-[2.5rem] p-8 pb-12 shadow-2xl"
          >
            <View className="flex-row justify-between items-center mb-8">
              <View>
                <Text className="text-2xl font-manrope font-black text-gray-800">
                  Specify Amount
                </Text>
                <Text className="text-[11px] font-manrope font-bold text-gray-400 uppercase tracking-[0.15em] mt-1">
                  Enter receiving amount
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
              >
                <X size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View className="bg-gray-50 rounded-[2rem] p-8 mb-8 border border-gray-100 items-center justify-center">
              <View className="flex-row items-center justify-center border-b-2 border-pink-100 pb-2 w-full max-w-[280px]">
                <Text className="text-3xl font-manrope font-black text-gray-400 mr-2 mt-1">฿</Text>

                {/* แก้ไข TextInput ตรงนี้ */}
                <TextInput
                  autoFocus
                  value={tempAmount}
                  onChangeText={(text) => {
                    const filtered = text.replace(/[^0-9.]/g, '');
                    const parts = filtered.split('.');
                    if (parts.length > 2) return;
                    setTempAmount(filtered);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#d1d5db"
                  selectionColor="#f48fb1"
                  className="font-manrope font-black text-[#f48fb1] text-center"
                  style={{
                    fontSize: 56, // ใช้ fontSize ตรงๆ แทน text-6xl เพื่อควบคุมได้ดีกว่า
                    lineHeight: 64, // ควบคุมความสูงของบรรทัด
                    paddingVertical: 0,
                    marginVertical: 0,
                    includeFontPadding: false, // สำคัญมากสำหรับ Android
                    minWidth: 160, // ให้มีพื้นที่กว้างพอเสมอ
                    height: 80, // กำหนดความสูงให้แน่นอน
                  }}
                  maxLength={9} // จำกัดจำนวนตัวเลขไม่ให้ล้นหน้าจอเกินไป
                />
              </View>
              <Text className="text-[11px] font-manrope font-bold text-gray-400 mt-6 tracking-wide text-center">
                Leave blank for any amount
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSetAmount}
              className="w-full h-16 bg-[#f48fb1] rounded-2xl items-center justify-center flex-row gap-3 shadow-lg shadow-pink-200 active:scale-95"
            >
              <Check size={20} color="white" strokeWidth={3} />
              <Text className="text-white font-manrope font-black text-base">Generate QR</Text>
            </TouchableOpacity>
          </MotiView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// Custom Check Icon for the Avatar Badge
function CheckIcon({ size, color, strokeWidth }: any) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}
