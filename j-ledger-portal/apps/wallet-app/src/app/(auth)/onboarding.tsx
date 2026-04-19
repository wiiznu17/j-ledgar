import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  ChevronLeft,
  Timer,
  Lock,
  ScanFace,
  CreditCard,
  Camera,
  CheckCircle2,
  ShieldCheck,
  User,
  Smartphone,
} from 'lucide-react-native';
import { GlassPanel } from '@/components/common/GlassPanel';
import { AppButton } from '@/components/common/AppButton';
import { AppTextInput } from '@/components/common/AppTextInput';
import { StepWrapper } from '@/components/common/StepWrapper';
import { MotiView } from 'moti';

const { width, height } = Dimensions.get('window');

type OnboardingStep =
  | 'WELCOME'
  | 'PHONE_INPUT'
  | 'OTP'
  | 'TERMS'
  | 'OCR_GUIDE'
  | 'OCR_SCAN'
  | 'OCR_REVIEW'
  | 'FACE_GUIDE'
  | 'FACE_SCAN'
  | 'ADDITIONAL_INFO'
  | 'SET_PASSWORD'
  | 'SUCCESS';

export default function OnboardingScreen() {
  const [step, setStep] = useState<OnboardingStep>('WELCOME');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [income, setIncome] = useState('');
  const [sourceOfFunds, setSourceOfFunds] = useState('');
  const [purpose, setPurpose] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [timer, setTimer] = useState(60);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);

  const router = useRouter();

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (step === 'OTP' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Capture Simulation Effect
  useEffect(() => {
    let interval: any;
    if (isCapturing) {
      setCaptureProgress(0);
      interval = setInterval(() => {
        setCaptureProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsCapturing(false);
            if (step === 'OCR_SCAN') setStep('OCR_REVIEW');
            else if (step === 'FACE_SCAN') setStep('ADDITIONAL_INFO');
            return 100;
          }
          return prev + 5;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isCapturing, step]);

  const formatPhone = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const renderHeader = (title: string, subtitle: string, onBack?: () => void) => (
    <View className="mb-10">
      {onBack && (
        <TouchableOpacity
          onPress={onBack}
          className="w-12 h-12 rounded-2xl bg-white/60 border border-outline-variant flex items-center justify-center mb-6 shadow-sm"
        >
          <ChevronLeft size={24} color="#2c2f33" />
        </TouchableOpacity>
      )}
      <Text className="text-3xl font-manrope font-extrabold tracking-tight text-on-surface mb-2 leading-tight">
        {title}
      </Text>
      <Text className="text-on-surfaceVariant text-sm font-manrope font-medium leading-relaxed">
        {subtitle}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6fc]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6">
          {/* Decorative Background Elements */}
          <View className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none overflow-hidden">
            <MotiView
              from={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.1 }}
              className="absolute top-[-100] left-[-100] w-[400] h-[400] bg-primary rounded-full"
              transition={{ type: 'timing', duration: 1000 }}
              style={{ filter: [{ blur: 100 }] }}
            />
            <MotiView
              from={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.1 }}
              className="absolute bottom-[-100] right-[-100] w-[400] h-[400] bg-secondary rounded-full"
              transition={{ type: 'timing', duration: 1000, delay: 500 }}
              style={{ filter: [{ blur: 100 }] }}
            />
          </View>

          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* STEP 0: WELCOME */}
            <StepWrapper visible={step === 'WELCOME'} direction="vertical">
              <View className="items-center">
                <MotiView
                  from={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring' }}
                  className="mb-8"
                >
                  <Image
                    source={require('../../../assets/images/j_ledger_logo_1776536282920.png')}
                    className="w-32 h-32"
                    resizeMode="contain"
                  />
                </MotiView>

                <Text className="text-4xl font-manrope font-black tracking-tighter text-on-surface text-center mb-4">
                  Welcome to{'\n'}J-Ledger
                </Text>
                <Text className="text-on-surfaceVariant text-center font-manrope font-medium mb-12 px-6">
                  The most secure and elegant way to manage your digital assets.
                </Text>

                <View className="w-full space-y-4">
                  <AppButton
                    title="Get Started"
                    onPress={() => setStep('PHONE_INPUT')}
                    icon={<ArrowRight size={20} color="white" />}
                  />
                  <TouchableOpacity
                    onPress={() => router.push('/login')}
                    className="w-full h-16 rounded-2xl items-center justify-center"
                  >
                    <Text className="text-on-surfaceVariant font-manrope font-bold">
                      Already have an account? <Text className="text-primary">Sign In</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </StepWrapper>

            {/* STEP 1: PHONE_INPUT */}
            <StepWrapper visible={step === 'PHONE_INPUT'}>
              {renderHeader(
                'Enter Phone',
                'First, tell us your mobile number to receive a verification code.',
                () => setStep('WELCOME'),
              )}

              <AppTextInput
                label="Mobile Number"
                placeholder="08X-XXX-XXXX"
                value={formatPhone(phone)}
                onChangeText={(val) => setPhone(val.replace(/\D/g, ''))}
                keyboardType="phone-pad"
                leftElement={
                  <View className="flex-row items-center border-r border-gray-100 pr-3 mr-1">
                    <Image
                      source={require('../../../assets/images/thailand_flag_icon_1776536326904.png')}
                      className="w-6 h-4 rounded-sm"
                    />
                    <Text className="ml-2 font-manrope font-bold text-on-surfaceVariant">+66</Text>
                  </View>
                }
              />

              <AppButton
                title="Continue"
                className="mt-8"
                disabled={phone.length < 9}
                onPress={() => {
                  setStep('OTP');
                  setTimer(60);
                }}
                icon={<ArrowRight size={20} color="white" />}
              />

              <Text className="text-center text-xs text-on-surfaceVariant/60 font-manrope font-medium mt-10 px-10 leading-relaxed">
                By continuing, you agree to our{' '}
                <Text className="text-primary underline">Terms of Service</Text> and{' '}
                <Text className="text-primary underline">Privacy Policy</Text>
              </Text>
            </StepWrapper>

            {/* STEP 2: OTP */}
            <StepWrapper visible={step === 'OTP'}>
              {renderHeader(
                'Verification',
                `We've sent a 6-digit code to ${formatPhone(phone)}`,
                () => setStep('PHONE_INPUT'),
              )}

              <View className="flex-row justify-between mb-10">
                {otp.map((digit, i) => (
                  <View
                    key={i}
                    className="w-[14%] aspect-[0.75] bg-white/40 border border-outline-variant/20 rounded-2xl items-center justify-center shadow-inner overflow-hidden"
                  >
                    <AppTextInput
                      className="text-center h-full p-0 text-2xl font-manrope font-black text-on-surface"
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
                title="Verify"
                disabled={otp.some((d) => !d)}
                onPress={() => setStep('TERMS')}
              />

              <TouchableOpacity
                disabled={timer > 0}
                onPress={() => setTimer(60)}
                className="flex-row items-center justify-center gap-2 mt-8"
              >
                <Timer size={16} color={timer > 0 ? '#f48fb1' : '#595b61'} />
                <Text
                  className={`font-manrope font-bold text-sm ${timer > 0 ? 'text-primary' : 'text-on-surfaceVariant'}`}
                >
                  {timer > 0 ? `Resend in ${timer}s` : 'Resend Code Now'}
                </Text>
              </TouchableOpacity>
            </StepWrapper>

            {/* STEP 3: TERMS */}
            <StepWrapper visible={step === 'TERMS'}>
              {renderHeader(
                'Terms of Service',
                'Please review and accept our terms before continuing.',
                () => setStep('OTP'),
              )}

              <GlassPanel className="h-[350] mb-8" intensity={20}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View className="space-y-6">
                    <View>
                      <Text className="font-manrope font-black text-on-surface uppercase mb-3 text-[10px] tracking-widest">
                        1. Introduction
                      </Text>
                      <Text className="font-manrope font-medium text-on-surfaceVariant text-xs leading-relaxed">
                        Welcome to J-Ledger. Our platform provides advanced financial services with
                        a focus on security and transparency. By creating an account, you agree to
                        comply with our Terms of Service and Privacy Policy.
                      </Text>
                    </View>
                    <View>
                      <Text className="font-manrope font-black text-on-surface uppercase mb-3 text-[10px] tracking-widest">
                        2. User Eligibility
                      </Text>
                      <Text className="font-manrope font-medium text-on-surfaceVariant text-xs leading-relaxed">
                        You must be at least 15 years old and provide a valid national ID card for
                        E-KYC verification. Identity theft or falsification will results in
                        permanent account suspension.
                      </Text>
                    </View>
                    <View>
                      <Text className="font-manrope font-black text-on-surface uppercase mb-3 text-[10px] tracking-widest">
                        3. Account Security
                      </Text>
                      <Text className="font-manrope font-medium text-on-surfaceVariant text-xs leading-relaxed">
                        You are responsible for maintaining the confidentiality of your PIN and
                        password. J-Ledger is not liable for unauthorized access resulting from user
                        negligence.
                      </Text>
                    </View>
                    <View>
                      <Text className="font-manrope font-black text-on-surface uppercase mb-3 text-[10px] tracking-widest">
                        4. Financial Regulations
                      </Text>
                      <Text className="font-manrope font-medium text-on-surfaceVariant text-xs leading-relaxed">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
                        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
                        quis nostrud exercitation ullamco laboris nisi ut aliquip.
                      </Text>
                    </View>
                  </View>
                </ScrollView>
              </GlassPanel>

              <AppButton title="Accept Term and Condition" onPress={() => setStep('OCR_GUIDE')} />
            </StepWrapper>

            {/* STEP 4: OCR_GUIDE */}
            <StepWrapper visible={step === 'OCR_GUIDE'} direction="vertical">
              <View className="items-center text-center">
                <View className="w-24 h-24 bg-primary/10 rounded-[35] items-center justify-center mb-10 shadow-inner">
                  <CreditCard size={48} color="#f48fb1" />
                </View>
                {renderHeader(
                  'ID Verification',
                  'We need to scan your National ID Card. Please ensure the card is well-lit and fits within the frame.',
                )}
                <AppButton
                  title="Scan National ID Card"
                  className="w-full mt-10"
                  onPress={() => setStep('OCR_SCAN')}
                />
              </View>
            </StepWrapper>

            {/* STEP 5: OCR_SCAN */}
            <StepWrapper visible={step === 'OCR_SCAN'}>
              <View className="items-center">
                <TouchableOpacity
                  onPress={() => setIsCapturing(true)}
                  className="w-full aspect-[1.58] bg-white/40 border-2 border-dashed border-primary/30 rounded-3xl items-center justify-center overflow-hidden"
                >
                  {!isCapturing ? (
                    <View className="items-center">
                      <Camera size={48} color="#f48fb140" />
                      <Text className="text-xs font-manrope font-bold text-on-surfaceVariant mt-4 uppercase tracking-widest">
                        Tap to start scan
                      </Text>
                    </View>
                  ) : (
                    <View className="w-full px-12 items-center">
                      <View className="w-full h-2 bg-gray-100/50 rounded-full overflow-hidden mb-6">
                        <MotiView
                          from={{ width: '0%' }}
                          animate={{ width: `${captureProgress}%` }}
                          className="h-full bg-primary"
                        />
                      </View>
                      <Text className="text-sm font-manrope font-black uppercase tracking-[0.2em] animate-pulse">
                        Scanning...
                      </Text>
                    </View>
                  )}

                  {/* Frame Corners */}
                  <View className="absolute top-6 left-6 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                  <View className="absolute top-6 right-6 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                  <View className="absolute bottom-6 left-6 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                  <View className="absolute bottom-6 right-6 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-2xl" />
                </TouchableOpacity>
                <Text className="text-xs font-manrope font-bold text-on-surfaceVariant/60 mt-10">
                  Ensure the front of your ID card is clear
                </Text>
              </View>
            </StepWrapper>

            {/* STEP 6: OCR_REVIEW */}
            <StepWrapper visible={step === 'OCR_REVIEW'}>
              {renderHeader(
                'Confirm Details',
                'Please check if your ID information was scanned correctly.',
              )}

              <View className="aspect-[1.58] w-full bg-white/40 rounded-3xl overflow-hidden shadow-inner mb-10 border border-outline-variant/10">
                <Image
                  source={{ uri: 'https://picsum.photos/seed/id_placeholder/800/500' }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                <View className="absolute bottom-0 left-0 right-0 bg-black/60 p-6 backdrop-blur-md">
                  <Text className="text-[10px] font-manrope font-bold uppercase tracking-[0.2em] text-white/70 mb-1">
                    National ID - Thai
                  </Text>
                  <Text className="text-lg font-manrope font-black text-white">SOMCHAI DEEJA</Text>
                </View>
              </View>

              <View className="flex-row gap-4">
                <AppButton
                  title="Rescan"
                  variant="outline"
                  containerClassName="flex-1"
                  onPress={() => setStep('OCR_SCAN')}
                />
                <AppButton
                  title="Confirm"
                  containerClassName="flex-[1.5]"
                  onPress={() => setStep('FACE_GUIDE')}
                />
              </View>
            </StepWrapper>

            {/* STEP 7: FACE_GUIDE */}
            <StepWrapper visible={step === 'FACE_GUIDE'} direction="vertical">
              <View className="items-center text-center">
                <View className="w-24 h-24 bg-primary/10 rounded-full items-center justify-center mb-10 shadow-inner">
                  <ScanFace size={48} color="#f48fb1" />
                </View>
                {renderHeader(
                  'Biometric Scan',
                  "Last step of identity check. We'll capture a short selfie to secure your account.",
                )}
                <AppButton
                  title="Start Face Scan"
                  className="w-full mt-10"
                  onPress={() => setStep('FACE_SCAN')}
                />
              </View>
            </StepWrapper>

            {/* STEP 8: FACE_SCAN */}
            <StepWrapper visible={step === 'FACE_SCAN'}>
              <View className="items-center">
                <TouchableOpacity
                  onPress={() => setIsCapturing(true)}
                  className="w-72 aspect-square bg-white/40 border-2 border-primary/10 rounded-full items-center justify-center overflow-hidden shadow-2xl"
                >
                  {!isCapturing ? (
                    <ScanFace size={96} color="#f48fb140" />
                  ) : (
                    <View className="items-center">
                      <MotiView
                        from={{ scale: 1, opacity: 0.3 }}
                        animate={{ scale: 1.2, opacity: 0.6 }}
                        transition={{ duration: 1500, repeat: -1, type: 'timing' }}
                        className="absolute w-[288] h-[288] border-[6px] border-primary rounded-full"
                      />
                      <Text className="text-4xl font-manrope font-black text-on-surface">
                        {captureProgress}%
                      </Text>
                      <Text className="text-[10px] font-manrope font-black uppercase tracking-[0.3em] animate-pulse mt-4 text-primary">
                        Capturing...
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <Text className="text-xs font-manrope font-bold text-on-surfaceVariant/60 mt-12">
                  Position your face within the circle
                </Text>
              </View>
            </StepWrapper>

            {/* STEP 9: ADDITIONAL_INFO */}
            <StepWrapper visible={step === 'ADDITIONAL_INFO'}>
              {renderHeader(
                'Additional Details',
                'We need a bit more info to finish setting up your account.',
              )}

              <View className="space-y-5">
                <View className="flex-row gap-4">
                  <AppTextInput
                    label="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    containerClassName="flex-1"
                  />
                  <AppTextInput
                    label="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    containerClassName="flex-1"
                  />
                </View>
                <AppTextInput
                  label="Home Address"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  placeholder="Full address..."
                />

                <View className="flex-row gap-4">
                  <AppTextInput
                    label="Occupation"
                    value={occupation}
                    onChangeText={setOccupation}
                    containerClassName="flex-1"
                    placeholder="e.g. Employee"
                  />
                  <AppTextInput
                    label="Income"
                    value={income}
                    onChangeText={setIncome}
                    containerClassName="flex-1"
                    placeholder="Monthly"
                  />
                </View>

                <View className="flex-row gap-4">
                  <AppTextInput
                    label="Source of funds"
                    value={sourceOfFunds}
                    onChangeText={setSourceOfFunds}
                    containerClassName="flex-1"
                    placeholder="e.g. Salary"
                  />
                  <AppTextInput
                    label="Purpose"
                    value={purpose}
                    onChangeText={setPurpose}
                    containerClassName="flex-1"
                    placeholder="e.g. Savings"
                  />
                </View>

                <AppButton
                  title="Confirm & Continue"
                  className="mt-8"
                  disabled={!firstName || !lastName || !address}
                  onPress={() => setStep('SET_PASSWORD')}
                />
              </View>
            </StepWrapper>

            {/* STEP 10: SET_PASSWORD */}
            <StepWrapper visible={step === 'SET_PASSWORD'}>
              <View className="items-center mb-10">
                <View className="w-20 h-20 bg-primary/10 rounded-[30] items-center justify-center mb-6">
                  <Lock size={40} color="#f48fb1" />
                </View>
                {renderHeader(
                  'Account Security',
                  'Create a secure password to protect your transactions.',
                )}
              </View>

              <View className="space-y-6">
                <AppTextInput
                  label="Password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                />
                <AppTextInput
                  label="Confirm Password"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repeat your password"
                  error={
                    password && confirmPassword && password !== confirmPassword
                      ? 'Passwords do not match'
                      : ''
                  }
                />

                <AppButton
                  title="Finish Registration"
                  containerClassName="mt-12"
                  disabled={!password || password !== confirmPassword || password.length < 8}
                  onPress={() => setStep('SUCCESS')}
                />
              </View>
            </StepWrapper>

            {/* STEP 11: SUCCESS */}
            <StepWrapper visible={step === 'SUCCESS'}>
              <View className="items-center">
                <MotiView
                  from={{ scale: 0.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                  className="mb-12"
                >
                  <Image
                    source={require('../../../assets/images/onboarding_success_1776536303717.png')}
                    className="w-56 h-56"
                    resizeMode="contain"
                  />
                </MotiView>

                <Text className="text-4xl font-manrope font-black tracking-tight text-on-surface text-center mb-4">
                  All Done!
                </Text>

                <GlassPanel className="w-full mb-12 shadow-2xl shadow-primary/5" intensity={25}>
                  <Text className="text-on-surface font-manrope font-extrabold text-xl text-center mb-3">
                    Verification in Progress
                  </Text>
                  <Text className="text-on-surfaceVariant font-manrope font-medium text-sm text-center leading-relaxed">
                    We're reviewing your documents. You'll receive a notification within{' '}
                    <Text className="text-primary font-black">24 hours</Text> when your account is
                    active.
                  </Text>
                </GlassPanel>

                <AppButton
                  title="Go to Dashboard"
                  className="w-full"
                  onPress={() => router.replace('/(tabs)')}
                />
              </View>
            </StepWrapper>
          </ScrollView>

          {/* Site Branding */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            className="py-8 items-center"
          >
            <Text className="text-[10px] font-manrope font-extrabold uppercase tracking-[0.4em] text-on-surfaceVariant/30">
              J-Ledger Finance Group
            </Text>
          </MotiView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
