import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
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
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react-native';
import { GlassPanel } from '@/components/common/GlassPanel';
import { AppButton } from '@/components/common/AppButton';
import { AppTextInput } from '@/components/common/AppTextInput';
import { StepWrapper } from '@/components/common/StepWrapper';
import { MotiView } from 'moti';
import axios from 'axios';
import { useRegistrationStore, RegistrationState } from '@/store/registration';
import { getStableDeviceId, getDeviceName } from '@/lib/device.utils';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

type OnboardingStepUI =
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
  | 'SET_PIN'
  | 'SUCCESS';

export default function OnboardingScreen() {
  const [step, setStep] = useState<OnboardingStepUI>('WELCOME');
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<Array<TextInput | null>>([]);
  const [challengeId, setChallengeId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [thaiName, setThaiName] = useState('');
  const [prefix, setPrefix] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [religion, setReligion] = useState('');
  const [address, setAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [incomeRange, setIncomeRange] = useState('');
  const [sourceOfFunds, setSourceOfFunds] = useState('');
  const [purpose, setPurpose] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('');
  const [timer, setTimer] = useState(60);

  const [idCardUri, setIdCardUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [livenessSessionId, setLivenessSessionId] = useState<string | null>(null);

  const router = useRouter();
  const { regToken, setRegToken, syncStatus, prefillData } = useRegistrationStore();

  // Initialize & Sync
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        const currentState = await syncStatus();
        mapBackendStateToUI(currentState);
      } catch (err) {
        console.error('Initial sync failed:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  // Update form when prefilled data arrives
  useEffect(() => {
    if (prefillData) {
      if (prefillData.firstName) setFirstName(prefillData.firstName);
      if (prefillData.lastName) setLastName(prefillData.lastName);
    }
  }, [prefillData]);

  const mapBackendStateToUI = (state: RegistrationState) => {
    switch (state) {
      case 'PENDING_OTP':
        setStep('WELCOME');
        break;
      case 'OTP_VERIFIED':
        setStep('TERMS');
        break;
      case 'TC_ACCEPTED':
        setStep('OCR_GUIDE');
        break;
      case 'ID_CARD_UPLOADED':
        setStep('FACE_GUIDE');
        break;
      case 'KYC_VERIFIED':
        setStep('ADDITIONAL_INFO');
        break;
      case 'PROFILE_COMPLETED':
        setStep('SET_PASSWORD');
        break;
      case 'PASSWORD_SET':
        setStep('SET_PIN');
        break;
      case 'CREDENTIALS_SET':
        setStep('SUCCESS');
        break;
      case 'COMPLETED':
        router.replace('/(tabs)');
        break;
      default:
        setStep('WELCOME');
    }
  };

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (step === 'OTP' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const formatPhone = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  // --- API HANDLERS ---

  const handlePhoneSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/register/init`, { phoneNumber: phone });
      setChallengeId(res.data.challengeId);
      setStep('OTP');
      setTimer(60);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    setIsLoading(true);
    const otpString = otp.join('').trim();
    console.log('[Onboarding] Verifying OTP:', otpString, 'for challenge:', challengeId);
    
    try {
      const res = await axios.post(`${API_URL}/auth/register/verify-otp`, {
        phoneNumber: phone,
        challengeId,
        otp: otpString,
      });
      await setRegToken(res.data.regToken);
      setStep('TERMS');
    } catch (err: any) {
      console.log('[Onboarding] Verification failed:', err.response?.data || err.message);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      Alert.alert('Error', err.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptTerms = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/auth/register/accept-terms`,
        { termsVersion: '1.0' },
        { headers: { Authorization: `Bearer ${regToken}` } },
      );
      await setRegToken(res.data.regToken);
      setStep('OCR_GUIDE');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to accept terms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIdCapture = async () => {
    let result;
    try {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
    } catch (e) {
      console.log('[Onboarding] Camera not available, falling back to gallery');
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets && result.assets[0]) {
      const uri = result.assets[0].uri;
      setIdCardUri(uri);

      // Upload & OCR
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append('idCardImage', {
          uri,
          name: 'id_card.jpg',
          type: 'image/jpeg',
        } as any);

        const res = await axios.post(`${API_URL}/kyc/id-card`, formData, {
          headers: {
            Authorization: `Bearer ${regToken}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        await setRegToken(res.data.regToken);
        setLivenessSessionId(res.data.livenessSessionId);
        // Pre-fill from OCR
        if (res.data.extractedData) {
          setFirstName(res.data.extractedData.firstName || '');
          setLastName(res.data.extractedData.lastName || '');
          setThaiName(res.data.extractedData.thaiName || '');
          setPrefix(res.data.extractedData.prefix || '');
          setIdNumber(res.data.extractedData.idCardNumber || '');
          setDateOfBirth(res.data.extractedData.dateOfBirth || '');
          setIssueDate(res.data.extractedData.idCardIssueDate || '');
          setExpiryDate(res.data.extractedData.idCardExpiryDate || '');
          setReligion(res.data.extractedData.religion || '');
        }
        setStep('OCR_REVIEW');
      } catch (err: any) {
        Alert.alert('OCR Failed', 'Could not read ID card. Please try again with better lighting.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelfieCapture = async () => {
    let result;
    try {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
    } catch (e) {
      console.log('[Onboarding] Camera not available, falling back to gallery for selfie');
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets && result.assets[0]) {
      const uri = result.assets[0].uri;
      setSelfieUri(uri);

      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append('selfieImage', {
          uri,
          name: 'selfie.jpg',
          type: 'image/jpeg',
        } as any);
        formData.append('livenessSessionId', livenessSessionId!);

        const res = await axios.post(`${API_URL}/kyc/selfie`, formData, {
          headers: {
            Authorization: `Bearer ${regToken}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        await setRegToken(res.data.regToken);
        setStep('ADDITIONAL_INFO');
      } catch (err: any) {
        Alert.alert('Face Match Failed', 'Identity could not be verified. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleProfileSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/auth/register/profile`,
        {
          firstName,
          lastName,
          address,
          occupation,
          incomeRange,
          sourceOfFunds,
          purposeOfAccount: purpose,
        },
        {
          headers: { Authorization: `Bearer ${regToken}` },
        },
      );
      await setRegToken(res.data.regToken);
      setStep('SET_PASSWORD');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/auth/register/password`,
        { password },
        { headers: { Authorization: `Bearer ${regToken}` } },
      );
      await setRegToken(res.data.regToken);
      setStep('SET_PIN');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to set password');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = async () => {
    setIsLoading(true);
    try {
      const deviceId = await getStableDeviceId();
      const deviceName = getDeviceName();

      const res = await axios.post(
        `${API_URL}/auth/register/pin`,
        { pin, deviceId, deviceName },
        { headers: { Authorization: `Bearer ${regToken}` } },
      );
      
      const newToken = res.data.regToken;
      await setRegToken(newToken);

      // Atomic Complete call - use the fresh token from the response
      const completeRes = await axios.post(
        `${API_URL}/auth/register/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${newToken}` },
        },
      );

      setStep('SUCCESS');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to complete credentials setup');
    } finally {
      setIsLoading(false);
    }
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
          {/* Decorative Background */}
          <View className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none overflow-hidden">
            <MotiView
              from={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.1 }}
              className="absolute top-[-100] left-[-100] w-[400] h-[400] bg-primary rounded-full"
              style={{ filter: [{ blur: 100 }] }}
            />
          </View>

          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'flex-start',
              paddingVertical: 20,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* STEP: WELCOME */}
            <StepWrapper visible={step === 'WELCOME'} direction="vertical">
              <View className="flex-1 items-center justify-center min-h-[500]">
                <Image
                  source={require('../../../assets/images/j_ledger_logo_1776536282920.png')}
                  className="w-32 h-32 mb-8"
                  resizeMode="contain"
                />
                <Text className="text-4xl font-manrope font-black tracking-tighter text-on-surface text-center mb-4">
                  Welcome to{'\n'}J-Ledger
                </Text>
                <AppButton
                  title="Get Started"
                  containerClassName="w-full mt-12"
                  onPress={() => setStep('PHONE_INPUT')}
                  icon={<ArrowRight size={20} color="white" />}
                />
              </View>
            </StepWrapper>

            {/* STEP: PHONE_INPUT */}
            <StepWrapper visible={step === 'PHONE_INPUT'}>
              {renderHeader('Enter Phone', 'We will send a code to verify your identity.', () =>
                setStep('WELCOME'),
              )}
              <AppTextInput
                label="Mobile Number"
                placeholder="08X-XXX-XXXX"
                value={formatPhone(phone)}
                onChangeText={(val) => setPhone(val.replace(/\D/g, ''))}
                keyboardType="phone-pad"
              />
              <AppButton
                title="Continue"
                loading={isLoading}
                className="mt-8"
                disabled={phone.length < 9}
                onPress={handlePhoneSubmit}
              />
            </StepWrapper>

            {/* STEP: OTP */}
            <StepWrapper visible={step === 'OTP'}>
              {renderHeader('Verification', `Sent to ${formatPhone(phone)}`, () =>
                setStep('PHONE_INPUT'),
              )}
              <View className="flex-row justify-between mb-10">
                {otp.map((digit, i) => (
                  <View
                    key={i}
                    className="w-[14%] aspect-[0.75] bg-white/40 border border-outline-variant/20 rounded-2xl items-center justify-center shadow-inner"
                  >
                    <TextInput
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      className="text-center w-full h-full p-0 text-2xl font-manrope font-black text-on-surface"
                      maxLength={1}
                      keyboardType="number-pad"
                      autoFocus={i === 0}
                      value={digit}
                      onChangeText={(val) => {
                        const digit = val.slice(-1);
                        setOtp((prev) => {
                          const next = [...prev];
                          next[i] = digit;
                          return next;
                        });
                        
                        if (val && i < 5) {
                          otpRefs.current[i + 1]?.focus();
                        }
                      }}
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
                          otpRefs.current[i - 1]?.focus();
                        }
                      }}
                    />
                  </View>
                ))}
              </View>
              <AppButton
                title="Verify"
                loading={isLoading}
                disabled={otp.some((d) => !d)}
                onPress={handleOtpVerify}
              />
            </StepWrapper>

            {/* STEP: TERMS */}
            <StepWrapper visible={step === 'TERMS'}>
              {renderHeader('Terms of Service', 'Please accept our terms to continue.')}
              <GlassPanel className="h-[300] mb-8" intensity={10}>
                <ScrollView>
                  <Text className="text-xs font-manrope font-medium leading-relaxed p-4">
                    Lorem ipsum legal text here...
                  </Text>
                </ScrollView>
              </GlassPanel>
              <AppButton
                title="Accept and Continue"
                loading={isLoading}
                onPress={handleAcceptTerms}
              />
            </StepWrapper>

            {/* STEP: OCR_GUIDE */}
            <StepWrapper visible={step === 'OCR_GUIDE'} direction="vertical">
              <View className="items-center">
                <View className="px-6 py-4 bg-yellow-50 rounded-2xl border border-yellow-200 mb-8 flex-row items-center gap-3">
                  <AlertCircle size={20} color="#eab308" />
                  <Text className="text-xs font-manrope font-bold text-yellow-800">
                    Ensure good lighting without glare
                  </Text>
                </View>
                {renderHeader('ID Capture', 'We need to scan the front of your National ID Card.')}
                <AppButton
                  title="Scan National ID"
                  className="w-full mt-8"
                  onPress={handleIdCapture}
                />
              </View>
            </StepWrapper>

            {/* STEP: OCR_REVIEW */}
            <StepWrapper visible={step === 'OCR_REVIEW'}>
              {renderHeader('Verify Details', 'Check if your information is correct.')}
              <View className="w-full aspect-[1.58] bg-white rounded-3xl mb-8 overflow-hidden">
                {idCardUri && <Image source={{ uri: idCardUri }} className="w-full h-full" />}
              </View>
              <ScrollView className="space-y-6" showsVerticalScrollIndicator={false}>
                <View className="mb-4">
                  <Text className="text-xs font-manrope font-extrabold text-primary mb-3">IDENTITY & DATES</Text>
                  <AppTextInput 
                    label="ID NUMBER" 
                    value={idNumber} 
                    onChangeText={setIdNumber}
                    keyboardType="number-pad"
                    maxLength={13}
                  />
                  <View className="flex-row gap-4 mt-4">
                    <View className="flex-1">
                      <AppTextInput label="ISSUE DATE" value={issueDate} onChangeText={setIssueDate} placeholder="DD/MM/YYYY" />
                    </View>
                    <View className="flex-1">
                      <AppTextInput label="EXPIRY DATE" value={expiryDate} onChangeText={setExpiryDate} placeholder="DD/MM/YYYY" />
                    </View>
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-xs font-manrope font-extrabold text-primary mb-3">THAI INFORMATION</Text>
                  <View className="flex-row gap-4">
                    <View className="w-24">
                      <AppTextInput label="PREFIX" value={prefix} onChangeText={setPrefix} />
                    </View>
                    <View className="flex-1">
                      <AppTextInput label="FULL NAME (THAI)" value={thaiName} onChangeText={setThaiName} />
                    </View>
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-xs font-manrope font-extrabold text-primary mb-3">ENGLISH INFORMATION</Text>
                  <AppTextInput label="FIRST NAME" value={firstName} onChangeText={setFirstName} />
                  <View className="mt-4">
                    <AppTextInput label="LAST NAME" value={lastName} onChangeText={setLastName} />
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-xs font-manrope font-extrabold text-primary mb-3">ADDITIONAL INFO</Text>
                  <AppTextInput label="DATE OF BIRTH" placeholder="DD/MM/YYYY" value={dateOfBirth} onChangeText={setDateOfBirth} />
                  <View className="mt-4">
                    <AppTextInput label="RELIGION" value={religion} onChangeText={setReligion} />
                  </View>
                  <View className="mt-4">
                    <AppTextInput label="ADDRESS" value={address} onChangeText={setAddress} multiline />
                  </View>
                </View>
                
                <View className="pt-6 space-y-4 mb-10">
                  <AppButton
                    title="Confirm Data"
                    loading={isLoading}
                    onPress={() => setStep('FACE_GUIDE')}
                  />
                  <AppButton title="Rescan" variant="outline" onPress={() => setStep('OCR_GUIDE')} />
                </View>
              </ScrollView>
            </StepWrapper>

            {/* STEP: FACE_GUIDE */}
            <StepWrapper visible={step === 'FACE_GUIDE'} direction="vertical">
              <View className="items-center">
                <View className="px-6 py-4 bg-primary/5 rounded-2xl border border-primary/10 mb-8 flex-row items-center gap-3">
                  <ScanFace size={20} color="#f48fb1" />
                  <Text className="text-xs font-manrope font-bold text-primary">
                    Biometric data is securely encrypted
                  </Text>
                </View>
                {renderHeader(
                  'Live Selfie',
                  'Position your face clearly in the frame for a liveness check.',
                )}
                <AppButton
                  title="Start Face Scan"
                  className="w-full mt-8"
                  onPress={handleSelfieCapture}
                />
              </View>
            </StepWrapper>

            {/* STEP: ADDITIONAL_INFO */}
            <StepWrapper visible={step === 'ADDITIONAL_INFO'}>
              {renderHeader('More Details', 'Tell us a bit more about yourself.')}
              <View className="space-y-4">
                <AppTextInput label="Address" value={address} onChangeText={setAddress} multiline />
                <View className="flex-row gap-4">
                  <AppTextInput
                    label="Occupation"
                    value={occupation}
                    onChangeText={setOccupation}
                    containerClassName="flex-1"
                  />
                  <AppTextInput
                    label="Monthly Income"
                    value={incomeRange}
                    onChangeText={setIncomeRange}
                    containerClassName="flex-1"
                  />
                </View>
                <AppTextInput
                  label="Source of funds"
                  value={sourceOfFunds}
                  onChangeText={setSourceOfFunds}
                />
                <AppTextInput
                  label="Purpose of Account"
                  value={purpose}
                  onChangeText={setPurpose}
                />
                <AppButton title="Next Step" loading={isLoading} onPress={handleProfileSubmit} />
              </View>
            </StepWrapper>

            {/* STEP: SET_PASSWORD */}
            <StepWrapper visible={step === 'SET_PASSWORD'}>
              {renderHeader('Account Password', 'Create a password to secure your login.')}
              <View className="space-y-4">
                <AppTextInput
                  label="Password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
                <AppTextInput
                  label="Confirm Password"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  error={
                    password && confirmPassword && password !== confirmPassword
                      ? 'Passwords do not match'
                      : ''
                  }
                />
                <AppButton
                  title="Continue"
                  loading={isLoading}
                  disabled={password.length < 8 || password !== confirmPassword}
                  onPress={handlePasswordSubmit}
                />
              </View>
            </StepWrapper>

            {/* STEP: SET_PIN */}
            <StepWrapper visible={step === 'SET_PIN'}>
              {renderHeader('Security PIN', 'Set a 6-digit PIN for transactions.')}
              <AppTextInput
                label="Transaction PIN"
                maxLength={6}
                keyboardType="number-pad"
                secureTextEntry
                value={pin}
                onChangeText={setPin}
                placeholder="6 digits"
              />
              <AppButton
                title="Finish & Bind Device"
                className="mt-8"
                loading={isLoading}
                disabled={pin.length !== 6}
                onPress={handlePinSubmit}
              />
            </StepWrapper>

            {/* STEP: SUCCESS */}
            <StepWrapper visible={step === 'SUCCESS'}>
              <View className="flex-1 items-center justify-center min-h-[500]">
                <Image
                  source={require('../../../assets/images/onboarding_success_1776536303717.png')}
                  className="w-56 h-56 mb-8"
                />
                <Text className="text-3xl font-manrope font-black text-center mb-4">
                  Registration Validated!
                </Text>
                <Text className="text-on-surfaceVariant text-center mb-12">
                  Your account is active and device is securely bound.
                </Text>
                <AppButton
                  title="Enter Wallet"
                  className="w-full"
                  onPress={() => router.replace('/(tabs)')}
                />
              </View>
            </StepWrapper>
          </ScrollView>

          {/* Site Branding */}
          <View className="py-8 items-center">
            <Text className="text-[10px] font-manrope font-extrabold uppercase tracking-[0.4em] text-on-surfaceVariant/30">
              J-Ledger Security Protocol V4
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
