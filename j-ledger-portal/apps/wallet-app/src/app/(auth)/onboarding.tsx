import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Onboarding from '@/components/onboarding';
import { GlassPanel } from '@/components/common/GlassPanel';
import { AppButton } from '@/components/common/AppButton';
import { AppTextInput } from '@/components/common/AppTextInput';
import { StepWrapper } from '@/components/common/StepWrapper';
import { MotiView } from 'moti';
import axios from 'axios';
import { useRegistrationStore, RegistrationState } from '@/store/registration';
import { getStableDeviceId, getDeviceName } from '@/lib/device.utils';

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
  | 'CONFIRM_PIN'
  | 'SUCCESS';

export default function OnboardingScreen() {
  const [step, setStep] = useState<OnboardingStepUI>('WELCOME');
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
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
  const [confirmPin, setConfirmPin] = useState('');
  const [timer, setTimer] = useState(60);

  const [idCardUri, setIdCardUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [livenessSessionId, setLivenessSessionId] = useState<string | null>(null);

  const router = useRouter();
  const { regToken, setRegToken, syncStatus, prefillData, reset } = useRegistrationStore();

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
    console.log(`[Onboarding] Mapping backend state: ${state}`);
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
        console.log('[Onboarding] Flow already completed, redirecting to app...');
        router.replace('/(tabs)');
        break;
      default:
        setStep('WELCOME');
    }
  };

  // Step transition log
  useEffect(() => {
    console.log(`[Onboarding] UI Step -> ${step}`);
  }, [step]);

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
        // Pre-fill from OCR (with Mock fallback for testing)
        const mockData = {
          firstName: 'JOHN',
          lastName: 'DOE',
          thaiName: 'สมชาย ดีใจ',
          prefix: 'นาย',
          idCardNumber: '1234567890123',
          dateOfBirth: '01/01/1990',
          idCardIssueDate: '10/10/2020',
          idCardExpiryDate: '10/10/2028',
          religion: 'พุทธ',
          address: '99/99 หมู่ 1 ต.ท่าตลาด อ.สามพราน จ.นครปฐม 73110',
        };

        const extracted = res.data.extractedData || mockData;

        setFirstName(extracted.firstName || mockData.firstName);
        setLastName(extracted.lastName || mockData.lastName);
        setThaiName(extracted.thaiName || mockData.thaiName);
        setPrefix(extracted.prefix || mockData.prefix);
        setIdNumber(extracted.idCardNumber || mockData.idCardNumber);
        setDateOfBirth(extracted.dateOfBirth || mockData.dateOfBirth);
        setIssueDate(extracted.idCardIssueDate || mockData.idCardIssueDate);
        setExpiryDate(extracted.idCardExpiryDate || mockData.idCardExpiryDate);
        setReligion(extracted.religion || mockData.religion);
        setAddress(extracted.address || mockData.address);

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

  const handlePinSubmit = async (finalPin: string) => {
    setIsLoading(true);
    try {
      const deviceId = await getStableDeviceId();
      const deviceName = getDeviceName();

      const res = await axios.post(
        `${API_URL}/auth/register/pin`,
        { pin: finalPin, deviceId, deviceName },
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

  const updateOcrData = (field: string, value: string) => {
    switch (field) {
      case 'idNumber':
        setIdNumber(value);
        break;
      case 'issueDate':
        setIssueDate(value);
        break;
      case 'expiryDate':
        setExpiryDate(value);
        break;
      case 'prefix':
        setPrefix(value);
        break;
      case 'thaiName':
        setThaiName(value);
        break;
      case 'firstName':
        setFirstName(value);
        break;
      case 'lastName':
        setLastName(value);
        break;
      case 'dateOfBirth':
        setDateOfBirth(value);
        break;
      case 'religion':
        setReligion(value);
        break;
      case 'address':
        setAddress(value);
        break;
    }
  };

  const updateProfileData = (field: string, value: string) => {
    switch (field) {
      case 'address':
        setAddress(value);
        break;
      case 'occupation':
        setOccupation(value);
        break;
      case 'incomeRange':
        setIncomeRange(value);
        break;
      case 'sourceOfFunds':
        setSourceOfFunds(value);
        break;
      case 'purpose':
        setPurpose(value);
        break;
    }
  };

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
            <Onboarding.WelcomeStep
              visible={step === 'WELCOME'}
              onGetStarted={() => setStep('PHONE_INPUT')}
              onBackToLogin={() => router.replace('/(auth)/login')}
            />

            <Onboarding.PhoneInputStep
              visible={step === 'PHONE_INPUT'}
              phone={phone}
              isLoading={isLoading}
              onPhoneChange={setPhone}
              onSubmit={handlePhoneSubmit}
              onBack={() => setStep('WELCOME')}
            />

            <Onboarding.OtpInputStep
              visible={step === 'OTP'}
              otp={otp}
              phone={phone}
              isLoading={isLoading}
              onOtpChange={(i, v) => {
                setOtp((prev) => {
                  const next = [...prev];
                  next[i] = v;
                  return next;
                });
              }}
              onSubmit={handleOtpVerify}
              onBack={() => setStep('PHONE_INPUT')}
            />

            <Onboarding.TermsStep
              visible={step === 'TERMS'}
              isLoading={isLoading}
              onAccept={handleAcceptTerms}
            />

            <Onboarding.OcrGuideStep visible={step === 'OCR_GUIDE'} onScan={handleIdCapture} />

            <Onboarding.OcrReviewStep
              visible={step === 'OCR_REVIEW'}
              idCardUri={idCardUri}
              data={{
                idNumber,
                issueDate,
                expiryDate,
                prefix,
                thaiName,
                firstName,
                lastName,
                dateOfBirth,
                religion,
                address,
              }}
              setData={updateOcrData}
              isLoading={isLoading}
              onConfirm={() => setStep('FACE_GUIDE')}
              onRescan={() => setStep('OCR_GUIDE')}
            />

            <Onboarding.FaceGuideStep
              visible={step === 'FACE_GUIDE'}
              onScan={handleSelfieCapture}
            />

            <Onboarding.AdditionalInfoStep
              visible={step === 'ADDITIONAL_INFO'}
              data={{ address, occupation, incomeRange, sourceOfFunds, purpose }}
              setData={updateProfileData}
              isLoading={isLoading}
              onSubmit={handleProfileSubmit}
            />

            <Onboarding.SetPasswordStep
              visible={step === 'SET_PASSWORD'}
              password={password}
              confirmPassword={confirmPassword}
              onPasswordChange={setPassword}
              onConfirmPasswordChange={setConfirmPassword}
              isLoading={isLoading}
              onSubmit={handlePasswordSubmit}
            />

            <Onboarding.SetPinStep
              visible={step === 'SET_PIN'}
              pin={pin}
              onPinChange={setPin}
              onComplete={() => setStep('CONFIRM_PIN')}
            />

            <Onboarding.SetPinStep2
              visible={step === 'CONFIRM_PIN'}
              pin={confirmPin}
              onPinChange={setConfirmPin}
              onComplete={(completedPin) => {
                if (completedPin === pin) {
                  handlePinSubmit(completedPin);
                } else {
                  Alert.alert('PIN Mismatch', 'Codes do not match. Please try again.');
                  setConfirmPin('');
                }
              }}
              onBack={() => {
                setPin('');
                setConfirmPin('');
                setStep('SET_PIN');
              }}
            />

            <Onboarding.SuccessStep
              visible={step === 'SUCCESS'}
              onEnterWallet={async () => {
                await reset(); // ล้าง registration_token และสถานะเดิมทั้งหมด
                router.replace('/login'); // ย้อนกลับไปหน้า Login เพื่อเริ่มใหม่
              }}
            />
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
