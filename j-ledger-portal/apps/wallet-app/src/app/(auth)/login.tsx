import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Smartphone,
  Lock,
  AlertCircle,
  Timer,
  ShieldCheck,
  ChevronLeft,
  ArrowRight,
} from 'lucide-react-native';
import { MotiView } from 'moti';
import { PinPad } from '@/components/common/PinPad';
import { AppTextInput } from '@/components/common/AppTextInput';
import { StepWrapper } from '@/components/common/StepWrapper';
import { useAuthStore } from '@/store/auth';

// จำลองฟังก์ชันและ API
const getStableDeviceId = async () => 'mock-device-id';
const getDeviceName = () => 'iPhone 15 Pro';
const API_URL = 'http://localhost:3000';
import axios from 'axios';

const { width } = Dimensions.get('window');

type LoginStep = 'CREDENTIALS' | 'OTP_CHALLENGE' | 'PIN' | 'LOCKOUT';

export default function LoginScreen() {
  const [step, setStep] = useState<LoginStep>('CREDENTIALS');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [challengeId, setChallengeId] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [lockoutTime, setLockoutTime] = useState(0);

  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (step === 'OTP_CHALLENGE' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Lockout Effect
  useEffect(() => {
    let interval: any;
    if (lockoutTime > 0) {
      setStep('LOCKOUT');
      interval = setInterval(() => {
        setLockoutTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setStep('CREDENTIALS');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutTime]);

  const formatPhone = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handleCredentialsSubmit = async () => {
    setIsLoading(true);
    setError('');

    // จำลองการข้าม API เพื่อความรวดเร็วในการเทส UI
    setTimeout(async () => {
      setIsLoading(false);

      // จำลองสถานการณ์: ถ้าพิมพ์รหัส 1234 ให้ติด OTP
      if (password === '1234') {
        setStep('OTP_CHALLENGE');
        setTimer(60);
        return;
      }

      // จำลองสถานการณ์ปกติ: ข้ามไปหน้า PIN
      await setToken('mock_token_xyz');
      setUser({ id: 'current', phoneNumber: phone });
      setStep('PIN');
    }, 1000);
  };

  const handleDeviceVerify = async () => {
    setIsLoading(true);
    setError('');

    setTimeout(async () => {
      setIsLoading(false);
      await setToken('mock_token_xyz');
      setUser({ id: 'current', phoneNumber: phone });
      setStep('PIN');
    }, 1000);
  };

  const handlePinComplete = async (completedPin: string) => {
    setIsLoading(true);

    // Mock Pin Verification (สมมติว่าใส่ครบก็ให้ผ่าน)
    setTimeout(() => {
      setIsLoading(false);
      if (completedPin === '123456' || completedPin.length === 6) {
        router.replace('/(tabs)' as any);
      } else {
        setError('Incorrect PIN.');
        setPin('');
      }
    }, 500);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View className="items-center mb-10 pt-10">
            <MotiView
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="mb-6 bg-white p-4 rounded-[2rem] shadow-xl shadow-pink-100/50"
            >
              {/* ถ้าหาไฟล์โลโก้ไม่เจอ ให้แสดงไอคอนชั่วคราว */}
              <View className="w-16 h-16 bg-pink-50 rounded-2xl items-center justify-center border border-pink-100">
                <ShieldCheck size={32} color="#f48fb1" />
              </View>
            </MotiView>
            <Text className="text-3xl font-manrope font-black tracking-tight text-gray-800 mb-2">
              J-Ledger
            </Text>
            <Text className="text-gray-400 font-manrope font-medium text-sm text-center px-4">
              Securely manage your digital assets with advanced cryptography
            </Text>
          </View>

          {/* ========================================= */}
          {/* STEP 1: CREDENTIALS */}
          {/* ========================================= */}
          <StepWrapper visible={step === 'CREDENTIALS'}>
            <View className="bg-white rounded-[2.5rem] p-8 border border-gray-50 shadow-sm mb-8 relative overflow-hidden">
              <View className="absolute -top-10 -right-10 w-32 h-32 bg-pink-50 rounded-full opacity-50" />

              <View className="mb-6">
                <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                  Mobile Number
                </Text>
                <View className="bg-gray-50 rounded-2xl">
                  <AppTextInput
                    placeholder="08X-XXX-XXXX"
                    value={formatPhone(phone)}
                    onChangeText={(val) => setPhone(val.replace(/\D/g, ''))}
                    keyboardType="phone-pad"
                    containerClassName="bg-transparent border border-gray-100 h-14"
                    className="font-manrope font-bold text-gray-800 text-base tracking-widest"
                    leftElement={<Smartphone size={18} color="#9ca3af" />}
                  />
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                  Password
                </Text>
                <View className="bg-gray-50 rounded-2xl">
                  <AppTextInput
                    placeholder="Enter your password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    containerClassName="bg-transparent border border-gray-100 h-14"
                    className="font-manrope font-bold text-gray-800 text-base"
                    leftElement={<Lock size={18} color="#9ca3af" />}
                  />
                </View>
              </View>

              {error ? (
                <View className="flex-row items-center gap-2 mb-4 bg-red-50 p-3 rounded-xl border border-red-100">
                  <AlertCircle size={14} color="#ef4444" />
                  <Text className="text-xs text-red-500 font-manrope font-bold flex-1">
                    {error}
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity
                disabled={!phone || !password || isLoading}
                onPress={handleCredentialsSubmit}
                className={`w-full h-14 rounded-2xl flex-row items-center justify-center gap-2 mt-4 shadow-sm active:scale-95 transition-all
                  ${!phone || !password ? 'bg-gray-200' : 'bg-[#f48fb1] shadow-pink-200'}`}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text
                      className={`font-manrope font-black text-sm ${!phone || !password ? 'text-gray-400' : 'text-white'}`}
                    >
                      Sign In
                    </Text>
                    <ArrowRight size={18} color={!phone || !password ? '#9ca3af' : 'white'} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/onboarding' as any)}
              className="items-center"
            >
              <Text className="text-sm font-manrope font-bold text-gray-400">
                New to J-Ledger?{' '}
                <Text className="text-[#f48fb1] font-black underline">Create a Wallet</Text>
              </Text>
            </TouchableOpacity>
          </StepWrapper>

          {/* ========================================= */}
          {/* STEP 2: OTP CHALLENGE */}
          {/* ========================================= */}
          <StepWrapper visible={step === 'OTP_CHALLENGE'}>
            <View className="bg-white rounded-[2.5rem] p-8 border border-gray-50 shadow-sm relative overflow-hidden">
              <View className="absolute -top-10 -right-10 w-32 h-32 bg-pink-50 rounded-full opacity-50" />

              <TouchableOpacity
                onPress={() => setStep('CREDENTIALS')}
                className="mb-6 w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
              >
                <ChevronLeft size={20} color="#1a1a1a" />
              </TouchableOpacity>

              <View className="items-center mb-8">
                <View className="w-16 h-16 bg-pink-50 rounded-[1.2rem] items-center justify-center border border-pink-100 mb-4">
                  <ShieldCheck size={28} color="#f48fb1" />
                </View>
                <Text className="text-xl font-manrope font-black text-gray-800 text-center tracking-tight mb-2">
                  Device Verification
                </Text>
                <Text className="text-xs text-gray-400 font-manrope font-medium text-center leading-relaxed">
                  Enter the 6-digit code sent to{'\n'}
                  <Text className="font-black text-gray-700">{formatPhone(phone)}</Text>
                </Text>
              </View>

              {/* OTP Inputs Layout */}
              <View className="flex-row justify-between mb-8">
                {otp.map((digit, i) => (
                  <View
                    key={i}
                    className={`w-[14%] aspect-[0.8] rounded-xl items-center justify-center border transition-colors ${
                      digit ? 'bg-pink-50 border-[#f48fb1]' : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <AppTextInput
                      className="text-center w-full h-full p-0 text-xl font-manrope font-black text-gray-800"
                      maxLength={1}
                      keyboardType="number-pad"
                      value={digit}
                      containerClassName="border-0 bg-transparent h-full w-full"
                      onChangeText={(val) => {
                        const newOtp = [...otp];
                        newOtp[i] = val.slice(-1);
                        setOtp(newOtp);
                      }}
                    />
                  </View>
                ))}
              </View>

              {error ? (
                <View className="flex-row items-center justify-center gap-2 mb-6">
                  <AlertCircle size={14} color="#ef4444" />
                  <Text className="text-xs text-red-500 font-manrope font-bold">{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                disabled={otp.some((d) => !d) || isLoading}
                onPress={handleDeviceVerify}
                className={`w-full h-14 rounded-2xl flex-row items-center justify-center gap-2 shadow-sm active:scale-95 transition-all
                  ${otp.some((d) => !d) ? 'bg-gray-200' : 'bg-[#f48fb1] shadow-pink-200'}`}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text
                    className={`font-manrope font-black text-sm ${otp.some((d) => !d) ? 'text-gray-400' : 'text-white'}`}
                  >
                    Verify Device
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                disabled={timer > 0}
                onPress={() => setTimer(60)}
                className="flex-row items-center justify-center gap-2 mt-8"
              >
                <Timer size={14} color={timer > 0 ? '#f48fb1' : '#9ca3af'} />
                <Text
                  className={`font-manrope font-bold text-xs ${timer > 0 ? 'text-[#f48fb1]' : 'text-gray-400'}`}
                >
                  {timer > 0 ? `Resend code in ${timer}s` : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </View>
          </StepWrapper>

          {/* ========================================= */}
          {/* STEP 3: PIN VERIFICATION */}
          {/* ========================================= */}
          <StepWrapper visible={step === 'PIN'}>
            <View className="items-center py-6">
              <MotiView
                from={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="items-center mb-10"
              >
                <View className="w-20 h-20 rounded-[1.5rem] bg-pink-50 border-4 border-white shadow-xl shadow-pink-100 mb-6 items-center justify-center">
                  <Lock size={32} color="#f48fb1" />
                </View>
                <Text className="text-2xl font-manrope font-black text-gray-800 tracking-tight mb-2">
                  Enter Secure PIN
                </Text>
                <Text className="text-sm font-manrope font-medium text-gray-400">
                  Welcome back to your wallet
                </Text>
              </MotiView>

              <PinPad pin={pin} setPin={setPin} length={6} onComplete={handlePinComplete} />

              {isLoading && (
                <View className="mt-8 bg-white p-4 rounded-full shadow-lg shadow-pink-100">
                  <ActivityIndicator color="#f48fb1" />
                </View>
              )}

              {error ? (
                <View className="mt-8 bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                  <Text className="text-center text-xs text-red-500 font-manrope font-bold">
                    {error}
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity onPress={() => setStep('CREDENTIALS')} className="mt-12 p-2">
                <Text className="text-xs font-manrope font-bold text-gray-400 uppercase tracking-widest">
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          </StepWrapper>

          {/* ========================================= */}
          {/* STEP 4: LOCKOUT */}
          {/* ========================================= */}
          <StepWrapper visible={step === 'LOCKOUT'}>
            <View className="bg-white rounded-[2.5rem] items-center p-10 border border-gray-50 shadow-xl shadow-red-100/30">
              <View className="w-24 h-24 bg-red-50 rounded-[1.5rem] items-center justify-center mb-8 border border-red-100">
                <AlertCircle size={40} color="#ef4444" />
              </View>
              <Text className="text-5xl font-manrope font-black text-red-500 mb-4 tracking-tighter">
                {Math.floor(lockoutTime / 60)}:{(lockoutTime % 60).toString().padStart(2, '0')}
              </Text>
              <Text className="text-2xl font-manrope font-black text-gray-800 mb-3 tracking-tight">
                Account Locked
              </Text>
              <Text className="text-sm text-gray-500 font-manrope font-medium text-center leading-relaxed">
                Too many failed attempts. For your security, please wait before trying again.
              </Text>
            </View>
          </StepWrapper>
        </ScrollView>

        {/* Footer Versioning */}
        <View className="absolute bottom-6 left-0 right-0 items-center pointer-events-none">
          <Text className="text-[9px] font-manrope font-black uppercase tracking-[0.4em] text-gray-300">
            J-Ledger Protocol V4
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
