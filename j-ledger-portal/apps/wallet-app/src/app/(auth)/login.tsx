import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Dimensions
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
  ArrowRight
} from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';
import { PinPad } from '@/components/common/PinPad';
import { AppButton } from '@/components/common/AppButton';
import { AppTextInput } from '@/components/common/AppTextInput';
import { GlassPanel } from '@/components/common/GlassPanel';
import { StepWrapper } from '@/components/common/StepWrapper';
import { useAuthStore } from '@/store/auth';

const { width } = Dimensions.get('window');

type LoginStep = 'CREDENTIALS' | 'OTP_CHALLENGE' | 'PIN' | 'LOCKOUT';

// Mock User for UI matching
const MOCK_USER = {
  name: "SOMCHAI DEEJA",
  phone: "0812345678",
  avatar: require('../../../assets/images/mock_user_avatar.png')
};

export default function LoginScreen() {
  const [step, setStep] = useState<LoginStep>('CREDENTIALS');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [lockoutTime, setLockoutTime] = useState(0);

  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (step === 'OTP_CHALLENGE' && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Lockout Effect
  useEffect(() => {
    let interval: any;
    if (lockoutTime > 0) {
      setStep('LOCKOUT');
      interval = setInterval(() => {
        setLockoutTime(prev => {
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

  const handleCredentialsSubmit = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone === MOCK_USER.phone || cleanPhone === '0812345678') {
      setError('');
      setStep('OTP_CHALLENGE');
      setTimer(60);
    } else {
      setError('Invalid Phone or Password');
    }
  };

  const handlePinComplete = (completedPin: string) => {
    if (completedPin === '111111') {
      setToken('mock_token');
      router.replace('/(tabs)' as any);
    } else {
      setError('Incorrect PIN. Please try again.');
      setPin('');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6fc]">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6 justify-center">
          {/* Background Decorative Elements */}
          <View className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none overflow-hidden">
             <MotiView 
                from={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.1, scale: 1 }}
                className="absolute top-[-50] left-[-50] w-[300] h-[300] bg-primary rounded-full"
                style={{ filter: [{ blur: 80 }] }}
             />
             <MotiView 
                from={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.1, scale: 1 }}
                className="absolute bottom-[-100] right-[-50] w-[400] h-[400] bg-secondary rounded-full"
                style={{ filter: [{ blur: 100 }] }}
             />
          </View>

          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            showsVerticalScrollIndicator={false}
          >
            <View className="items-center mb-10">
              <MotiView 
                from={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring' }}
                className="mb-6"
              >
                <Image 
                   source={require('../../../assets/images/j_ledger_logo_1776536282920.png')}
                   className="w-24 h-24"
                   resizeMode="contain"
                />
              </MotiView>
              <Text className="text-3xl font-manrope font-black tracking-tighter text-on-surface text-center mb-1">
                J-Ledger
              </Text>
              <Text className="text-on-surfaceVariant font-manrope font-medium text-sm text-center">
                Securely manage your digital assets
              </Text>
            </View>

            <StepWrapper visible={step === 'CREDENTIALS'}>
              <GlassPanel intensity={30} className="shadow-2xl shadow-primary/5">
                <View className="space-y-6">
                  <AppTextInput 
                    label="Mobile Number"
                    placeholder="08X-XXX-XXXX"
                    value={formatPhone(phone)}
                    onChangeText={(val) => setPhone(val.replace(/\D/g, ''))}
                    keyboardType="phone-pad"
                    leftElement={<Smartphone size={18} color="#595b61" />}
                  />
                  <AppTextInput 
                    label="Password"
                    placeholder="Enter your password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    leftElement={<Lock size={18} color="#595b61" />}
                  />
                  
                  {error ? (
                    <View className="flex-row items-center gap-2 px-1">
                      <AlertCircle size={14} color="#ef4444" />
                      <Text className="text-xs text-red-500 font-manrope font-bold">{error}</Text>
                    </View>
                  ) : null}

                  <AppButton 
                    title="Continue" 
                    className="mt-4"
                    disabled={!phone || !password}
                    onPress={handleCredentialsSubmit}
                    icon={<ArrowRight size={20} color="white" />}
                  />

                  <TouchableOpacity 
                    onPress={() => router.push('/onboarding')}
                    className="mt-6 items-center"
                  >
                    <Text className="text-sm font-manrope font-bold text-on-surfaceVariant">
                      New to J-Ledger? <Text className="text-primary underline">Create a Wallet</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </GlassPanel>
            </StepWrapper>

            <StepWrapper visible={step === 'OTP_CHALLENGE'}>
              <GlassPanel intensity={30} className="shadow-2xl shadow-primary/5">
                <TouchableOpacity 
                  onPress={() => setStep('CREDENTIALS')}
                  className="mb-6"
                >
                  <ChevronLeft size={24} color="#2c2f33" />
                </TouchableOpacity>

                <View className="items-center mb-8">
                  <View className="w-16 h-16 bg-primary/10 rounded-2xl items-center justify-center mb-4">
                    <ShieldCheck size={32} color="#f48fb1" />
                  </View>
                  <Text className="text-lg font-manrope font-black text-on-surface text-center">Device Binding</Text>
                  <Text className="text-xs text-on-surfaceVariant font-manrope font-medium text-center px-4 mt-2">
                    Enter the 6-digit code sent to {formatPhone(phone)}
                  </Text>
                </View>

                <View className="flex-row justify-between mb-10">
                  {otp.map((digit, i) => (
                    <View key={i} className="w-[14%] aspect-[0.75] bg-white/40 border border-outline-variant/10 rounded-xl items-center justify-center shadow-inner">
                      <AppTextInput 
                        className="text-center h-full p-0 text-xl font-manrope font-black text-on-surface"
                        maxLength={1}
                        keyboardType="number-pad"
                        value={digit}
                        containerClassName="border-0 bg-transparent"
                        onChangeText={(val) => {
                           const newOtp = [...otp];
                           newOtp[i] = val.slice(-1);
                           setOtp(newOtp);
                        }}
                      />
                    </View>
                  ))}
                </View>

                <AppButton 
                  title="Verify & Bind Device" 
                  disabled={otp.some(d => !d)}
                  onPress={() => setStep('PIN')}
                />
                
                <TouchableOpacity 
                  disabled={timer > 0}
                  onPress={() => setTimer(60)}
                  className="flex-row items-center justify-center gap-2 mt-8"
                >
                  <Timer size={16} color={timer > 0 ? "#f48fb1" : "#595b61"} />
                  <Text className={`font-manrope font-bold text-xs ${timer > 0 ? 'text-primary' : 'text-on-surfaceVariant'}`}>
                    {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              </GlassPanel>
            </StepWrapper>

            <StepWrapper visible={step === 'PIN'}>
              <View className="items-center">
                <MotiView 
                   from={{ scale: 0.5, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   className="items-center mb-10"
                >
                  <Image 
                    source={MOCK_USER.avatar} 
                    className="w-24 h-24 rounded-[30] border-4 border-white shadow-xl mb-4"
                  />
                  <Text className="text-xl font-manrope font-black text-on-surface">{MOCK_USER.name}</Text>
                  <Text className="text-sm font-manrope font-medium text-on-surfaceVariant">Welcome back!</Text>
                </MotiView>

                <PinPad pin={pin} setPin={setPin} length={6} onComplete={handlePinComplete} />
                
                {error ? <Text className="text-center text-xs text-red-500 font-manrope font-bold mt-6">{error}</Text> : null}

                <View className="mt-12 items-center flex-row gap-8">
                  <TouchableOpacity onPress={() => router.push('/recovery' as any)}>
                    <Text className="text-sm font-manrope font-bold text-on-surfaceVariant/60">Forgot PIN?</Text>
                  </TouchableOpacity>
                  <View className="w-1 h-1 rounded-full bg-on-surfaceVariant/20" />
                  <TouchableOpacity onPress={() => setStep('CREDENTIALS')}>
                    <Text className="text-sm font-manrope font-bold text-primary">Switch Account</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </StepWrapper>

            <StepWrapper visible={step === 'LOCKOUT'}>
               <GlassPanel intensity={30} className="items-center py-10">
                  <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-6">
                    <AlertCircle size={40} color="#ef4444" />
                  </View>
                  <Text className="text-4xl font-manrope font-black text-red-500 mb-2">
                    {Math.floor(lockoutTime / 60)}:{(lockoutTime % 60).toString().padStart(2, '0')}
                  </Text>
                  <Text className="text-lg font-manrope font-black text-on-surface mb-2">Account Locked</Text>
                  <Text className="text-sm text-on-surfaceVariant font-manrope font-medium text-center px-6 leading-relaxed">
                    Too many failed attempts. For your security, please wait before trying again.
                  </Text>
               </GlassPanel>
            </StepWrapper>

          </ScrollView>

          <View className="py-10 items-center">
             <Text className="text-[10px] font-manrope font-black uppercase tracking-[0.4em] text-on-surfaceVariant/20">
               J-Ledger Security Protocol V4
             </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
