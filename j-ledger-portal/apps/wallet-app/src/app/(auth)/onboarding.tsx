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
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as SecureStore from 'expo-secure-store';
import * as Onboarding from '@/components/onboarding';
import { FaceLivenessScanner, IDCardScanner } from '@/components/onboarding';
import { GlassPanel } from '@/components/common/GlassPanel';
import { AppButton } from '@/components/common/AppButton';
import { AppTextInput } from '@/components/common/AppTextInput';
import { StepWrapper } from '@/components/common/StepWrapper';
import { MotiView } from 'moti';
import { api } from '@/lib/axios';
import { useRegistrationStore, RegistrationState } from '@/store/registration';
import { useAuthStore } from '@/store/auth';
import { getStableDeviceId, getDeviceName } from '@/lib/device.utils';
import { useScreenCaptureProtection } from '@/hooks/useScreenCaptureProtection';

// const { width, height } = Dimensions.get('window');

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
  // Prevent screen capture during onboarding (sensitive data flow)
  useScreenCaptureProtection();

  const [step, setStep] = useState<OnboardingStepUI>('WELCOME');
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [challengeId, setChallengeId] = useState('');
  const [firstNameEn, setFirstNameEn] = useState('');
  const [lastNameEn, setLastNameEn] = useState('');
  const [prefixEn, setPrefixEn] = useState('');
  const [firstNameTh, setFirstNameTh] = useState('');
  const [lastNameTh, setLastNameTh] = useState('');
  const [prefixTh, setPrefixTh] = useState('');
  const [thaiName, setThaiName] = useState(''); // Keep for raw OCR storage
  const [idNumber, setIdNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [religion, setReligion] = useState('');
  const [address, setAddress] = useState<any>({
    line1: '',
    subdistrict: '',
    district: '',
    province: '',
    postalCode: '',
    label: '',
  });
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
  const [isScanningID, setIsScanningID] = useState(false);

  const [idCardAddress, setIdCardAddress] = useState<any>(null);

  const router = useRouter();
  const { 
    regToken, 
    setRegToken, 
    syncStatus, 
    prefillData, 
    reset, 
    initialize,
  } = useRegistrationStore();
  
  const { refreshSession } = useAuthStore();


  // Initialize & Sync
  useEffect(() => {
    const initializeFlow = async () => {
      setIsLoading(true);
      try {
        // 1. Load token from SecureStore first
        await initialize();
        // 2. Sync with backend status
        const currentState = await syncStatus();
        mapBackendStateToUI(currentState);
      } catch (err) {
        console.error('Initial sync failed:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initializeFlow();
  }, []);

  // Update form when prefilled data arrives (Resume Flow)
  useEffect(() => {
    if (prefillData) {
      console.log('[Onboarding] Applying prefilled data from backend');
      const { identity, addresses, profile } = prefillData;
      
      // Helper to format ISO date (YYYY-MM-DD) to Thai UI format (DD MMM YYYY)
      const formatToThaiDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '';
        const datePart = (dateStr as string).split('T')[0] || '';
        const parts = datePart.split('-');
        if (parts.length === 3) {
          const [y, m, d] = parts;
          const THAI_MONTHS_SHORT = [
            'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
          ];
          const mIdx = parseInt(m as string) - 1;
          return `${parseInt(d as string)} ${THAI_MONTHS_SHORT[mIdx]} ${parseInt(y as string) + 543}`;
        }
        return '';
      };

      if (identity) {
        if (identity.idNumber) setIdNumber(identity.idNumber);
        if (identity.prefixTh) setPrefixTh(identity.prefixTh);
        if (identity.firstNameTh) setFirstNameTh(identity.firstNameTh);
        if (identity.lastNameTh) setLastNameTh(identity.lastNameTh);
        if (identity.prefixEn) setPrefixEn(identity.prefixEn);
        if (identity.firstNameEn) setFirstNameEn(identity.firstNameEn);
        if (identity.lastNameEn) setLastNameEn(identity.lastNameEn);
        
        // Format dates correctly for ThaiDatePickerModal (DD/MM/YYYY with B.E.)
        if (identity.dateOfBirth) setDateOfBirth(formatToThaiDate(identity.dateOfBirth));
        if (identity.issueDate) setIssueDate(formatToThaiDate(identity.issueDate));
        if (identity.expiryDate) setExpiryDate(formatToThaiDate(identity.expiryDate));
        
        if (identity.religion) setReligion(identity.religion);
        
        // Restore ID card image from backend URL if local URI is missing
        if (identity.idCardUrl && !idCardUri) {
          console.log('[Onboarding] Restoring ID card image from backend URL');
          setIdCardUri(identity.idCardUrl);
        }

        // Handle raw address string if we are at OCR_REVIEW and don't have structured data
        if (identity.idCardAddress && !addresses?.registered && step === 'OCR_REVIEW') {
          console.log('[Onboarding] Using raw ID card address string for review');
          setAddress((prev: any) => ({
            ...prev,
            line1: identity.idCardAddress,
          }));
        }
      }

      if (addresses) {
        if (addresses.registered) {
          const regAddr = addresses.registered;
          setIdCardAddress(regAddr);
          
          // Only use registered address if we are in OCR steps
          if (step === 'OCR_REVIEW' || step === 'OCR_SCAN' || !addresses.current) {
            setAddress({
              line1: regAddr.line1 || '',
              subdistrict: regAddr.subdistrict || '',
              district: regAddr.district || '',
              province: regAddr.province || '',
              postalCode: regAddr.postalCode || '',
            });
          }
        }
        
        // Only apply current address if we are at or past ADDITIONAL_INFO step
        if (addresses.current && step !== 'OCR_REVIEW') {
          setAddress(addresses.current);
        }
      }

      if (profile && step !== 'OCR_REVIEW') {
        if (profile.occupation) setOccupation(profile.occupation);
        if (profile.incomeRange) setIncomeRange(profile.incomeRange);
        if (profile.sourceOfFunds) setSourceOfFunds(profile.sourceOfFunds);
        if (profile.purposeOfAccount) setPurpose(profile.purposeOfAccount);
      }
    }
  }, [prefillData, step]);

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
        setStep('OCR_REVIEW'); // แสดงหน้า Review ก่อนเสมอ
        break;
      case 'ID_CARD_CONFIRMED':
        setStep('FACE_GUIDE'); // เมื่อยืนยันแล้วค่อยไปสแกนหน้า
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
      const res = await api.post('/identity/register/init', { phoneNumber: phone });
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
      const res = await api.post('/identity/register/verify-otp', {
        phoneNumber: phone,
        challengeId,
        otp: otpString,
      });
      await setRegToken(res.data.regToken);
      
      // Sync with backend to find the actual state to resume
      console.log('[Onboarding] OTP Verified, syncing state to resume...');
      const currentState = await syncStatus();
      mapBackendStateToUI(currentState);
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
      const res = await api.post(
        '/identity/register/accept-terms',
        { termsVersion: '1.0' },
        {
          headers: { Authorization: `Bearer ${regToken}` },
        },
      );
      if (res.data.regToken) await setRegToken(res.data.regToken);
      setStep('OCR_GUIDE');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to accept terms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIdCapture = async () => {
    setIsScanningID(true);
  };

  const onIDScanned = async (uri: string) => {
    // Note: Do NOT call setIsScanningID(false) here yet. 
    // We want to keep the scanner visible while we process with the backend.
    setIdCardUri(uri);

    // Upload & OCR
    setIsLoading(true);
    try {
    // IDCardScanner already cropped and compressed the image. 
    // We can use the URI directly or just do a minimal check.
    const finalUri = uri;

      const formData = new FormData();
      formData.append('idCardImage', {
        uri: finalUri,
        name: 'id_card.jpg',
        type: 'image/jpeg',
      } as any);

      const res = await api.post('/kyc/upload-id-card', formData, {
        headers: {
          Authorization: `Bearer ${regToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.regToken) await setRegToken(res.data.regToken);
      setLivenessSessionId(res.data.livenessSessionId);

      const extracted = res.data.extractedData;
      console.log('[Onboarding] OCR Extracted Data:', JSON.stringify(extracted, null, 2));

      if (!extracted || !extracted.idNumber || !extracted.firstNameTh || !extracted.lastNameTh || !extracted.idCardIssueDate) {
        Alert.alert(
          'Scanning Failed',
          'We couldn\'t read some essential information (ID number, Name, or Issue Date). Please ensure the card is clear and well-lit, then try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Auto-fill states with extracted data
      setIdNumber(extracted.idNumber || '');
      setPrefixEn(extracted.prefixEn || '');
      setFirstNameEn(extracted.firstNameEn || '');
      setLastNameEn(extracted.lastNameEn || '');
      setPrefixTh(extracted.prefixTh || '');
      setFirstNameTh(extracted.firstNameTh || '');
      setLastNameTh(extracted.lastNameTh || '');
      setDateOfBirth(extracted.dateOfBirth || '');
      setIssueDate(extracted.idCardIssueDate || '');
      setExpiryDate(extracted.idCardExpiryDate || '');
      setReligion(extracted.religion || '');
      
      if (extracted.registeredAddress) {
        const addr = {
          line1: extracted.registeredAddress,
          subdistrict: extracted.subdistrict || '',
          district: extracted.district || '',
          province: extracted.province || '',
          postalCode: extracted.postalCode || '',
        };
        setAddress(addr);
        setIdCardAddress(addr);
      }
      
      // If we have full text, log it for debugging
      if (extracted.fullText) {
        console.log('[Onboarding] Full OCR Text Analysis Complete');
      }

      setIsScanningID(false); // Only close the scanner on success
      setStep('OCR_REVIEW');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Could not process ID card. Please check your connection and try again.';
      console.log('[Onboarding] OCR Failed:', err.response?.data || err.message);
      Alert.alert('Scanning Failed', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelfieCapture = async () => {
    // Transition to the actual Liveness Scan step
    setStep('FACE_SCAN');
  };

  const handleLivenessSuccess = async (uri: string) => {
    setIsLoading(true);
    try {
      // Compress image before upload
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const formData = new FormData();
      formData.append('selfieImage', {
        uri: manipResult.uri,
        name: 'selfie.jpg',
        type: 'image/jpeg',
      } as any);

      // After custom scan is successful, we upload to verify with ID card
      const res = await api.post('/kyc/submit-selfie', formData, {
        headers: { 
          Authorization: `Bearer ${regToken}`,
          'Content-Type': 'multipart/form-data',
        }
      });
      
      if (res.data.regToken) await setRegToken(res.data.regToken);
      setStep('ADDITIONAL_INFO');
    } catch (err: any) {
      Alert.alert('Verification Failed', 'Could not verify your identity. Please ensure you are the same person as on the ID card.');
      setStep('FACE_GUIDE');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmOcr = async () => {
    setIsLoading(true);
    
    // Clean address object: Remove label and postalCode (backend doesn't allow them here)
    const { label, postalCode, ...cleanAddress } = address;
    
    const payload = {
      idNumber,
      issueDate,
      expiryDate,
      prefixTh,
      firstNameTh,
      lastNameTh,
      prefixEn,
      firstNameEn,
      lastNameEn,
      dateOfBirth,
      religion,
      registeredAddress: cleanAddress,
    };

    console.log('[Onboarding] Sending Confirm OCR Data:', JSON.stringify(payload, null, 2));

    try {
      const res = await api.post('/kyc/confirm-ocr', payload, {
        headers: { Authorization: `Bearer ${regToken}` },
      });
      console.log('[Onboarding] OCR Data Confirmed Successfully');
      
      // Update idCardAddress with the data that was just confirmed
      // This ensures "Same as ID Card" uses the corrected data, not the raw OCR.
      setIdCardAddress(address);
      
      setStep('FACE_GUIDE');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message;
      console.error('[Onboarding] Confirm OCR Error details:', JSON.stringify(err.response?.data, null, 2) || err);
      Alert.alert('Error', `Failed to save identity data: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (useIdentityAddress: boolean) => {
    setIsLoading(true);
    try {
      const profileData: any = {
        occupation,
        incomeRange,
        sourceOfFunds,
        purposeOfAccount: purpose,
      };

      if (useIdentityAddress) {
        profileData.useIdentityAddress = true;
        profileData.currentAddress = {
          postalCode: address.postalCode,
        };
      } else {
        // Sanitize address: only pick fields that the backend expects (UpdateAddressDto)
        // This prevents validation errors like "id should not exist" during Retry flows
        const { line1, subdistrict, district, province, postalCode, label } = address;
        profileData.currentAddress = { line1, subdistrict, district, province, postalCode, label };
      }

      console.log('[Onboarding] Submitting Profile Data:', JSON.stringify(profileData, null, 2));

      const res = await api.post(
        '/identity/register/profile',
        profileData,
        {
          headers: { Authorization: `Bearer ${regToken}` },
        },
      );
      
      console.log('[Onboarding] Profile Submit Response:', res.data);
      
      if (res.data.regToken) await setRegToken(res.data.regToken);
      
      if (res.data.nextState) {
        if (res.data.nextState === 'COMPLETED') {
          // If skipping to completion, refresh session first to get updated status and trigger guards
          await refreshSession();
        }
        mapBackendStateToUI(res.data.nextState);
      } else {
        setStep('SET_PASSWORD');
      }
    } catch (err: any) {
      console.error('[Onboarding] Profile Submit FAILED:', err.response?.data || err.message);
      Alert.alert('Error', err.response?.data?.message || 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await api.post(
        '/identity/register/password',
        { password },
        { headers: { Authorization: `Bearer ${regToken}` } },
      );
      if (res.data.regToken) await setRegToken(res.data.regToken);
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

      const res = await api.post(
        '/identity/register/pin',
        { pin: finalPin, deviceId, deviceName },
        { headers: { Authorization: `Bearer ${regToken}` } },
      );

      const newToken = res.data.regToken || regToken;
      if (res.data.regToken) await setRegToken(newToken);

      // Atomic Complete call - use the fresh token from the response
      const completeRes = await api.post(
        '/identity/register/complete',
        {},
        {
          headers: { Authorization: `Bearer ${newToken}` },
        },
      );

      // Save tokens returned from completeRegistration for seamless login
      if (completeRes.data.accessToken && completeRes.data.refreshToken) {
        console.log('[Onboarding] Registration complete, saving tokens for seamless experience');
        const { useAuthStore } = await import('@/store/auth');
        await useAuthStore.getState().setToken(completeRes.data.accessToken, completeRes.data.refreshToken);
        if (completeRes.data.user) {
          useAuthStore.getState().setUser(completeRes.data.user);
        }
        // Force refresh to be absolutely sure we have the server-side status
        await useAuthStore.getState().refreshSession();
      }

      setStep('SUCCESS');
    } catch (err: any) {
      console.error('[Onboarding] Pin setup/complete failed:', err.response?.data || err.message);
      Alert.alert('Registration Failed', err.response?.data?.message || 'Could not complete registration. Please try again.');
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
      case 'prefixTh':
        setPrefixTh(value);
        break;
      case 'firstNameTh':
        setFirstNameTh(value);
        break;
      case 'lastNameTh':
        setLastNameTh(value);
        break;
      case 'prefixEn':
        setPrefixEn(value);
        break;
      case 'firstNameEn':
        setFirstNameEn(value);
        break;
      case 'lastNameEn':
        setLastNameEn(value);
        break;
      case 'dateOfBirth':
        setDateOfBirth(value);
        break;
      case 'religion':
        setReligion(value);
        break;
      case 'addressField':
        // value is { field, text }
        const { field, text } = value as any;
        setAddress((prev: any) => ({ ...prev, [field]: text }));
        break;
    }
  };

  const updateProfileData = (field: string, value: string) => {
    switch (field) {
      case 'addressField':
        const { field: addrField, text } = value as any;
        setAddress((prev: any) => ({ ...prev, [addrField]: text }));
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
    <>
      <SafeAreaView className="flex-1 bg-transparent">
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
              resendTimer={timer}
              onOtpChange={(i, v) => {
                setOtp((prev) => {
                  const next = [...prev];
                  next[i] = v;
                  return next;
                });
              }}
              onResend={handlePhoneSubmit}
              onSubmit={handleOtpVerify}
              onBack={() => setStep('PHONE_INPUT')}
            />

            <Onboarding.TermsStep
              visible={step === 'TERMS'}
              isLoading={isLoading}
              onAccept={handleAcceptTerms}
              onBack={() => setStep('OTP')}
            />

            <Onboarding.OcrGuideStep visible={step === 'OCR_GUIDE'} onScan={handleIdCapture} />

            <Onboarding.OcrReviewStep
              visible={step === 'OCR_REVIEW'}
              idCardUri={idCardUri}
              data={{
                idNumber,
                issueDate,
                expiryDate,
                prefixTh,
                firstNameTh,
                lastNameTh,
                prefixEn,
                firstNameEn,
                lastNameEn,
                dateOfBirth,
                religion,
                registeredAddress: address,
              }}
              setData={updateOcrData}
              isLoading={isLoading}
              onConfirm={handleConfirmOcr}
              onRescan={() => setStep('OCR_GUIDE')}
            />

            <Onboarding.FaceGuideStep
              visible={step === 'FACE_GUIDE'}
              onScan={handleSelfieCapture}
            />

            {step === 'FACE_SCAN' && (
              <FaceLivenessScanner
                isLoading={isLoading}
                onComplete={handleLivenessSuccess}
                onError={(err) => {
                  Alert.alert('Liveness Error', 'Something went wrong during face scan.');
                  setStep('FACE_GUIDE');
                }}
                onCancel={() => setStep('FACE_GUIDE')}
              />
            )}

            <Onboarding.AdditionalInfoStep
              visible={step === 'ADDITIONAL_INFO'}
              data={{ address, occupation, incomeRange, sourceOfFunds, purpose }}
              idCardAddress={idCardAddress}
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
                setIsLoading(true);
                try {
                  await reset(); // ล้าง registration_token
                  // The RootLayout will automatically pick up the new auth state 
                  // and redirect to the appropriate screen (Pending Approval or Tabs)
                } finally {
                  setIsLoading(false);
                }
              }}
            />
          </ScrollView>

          {/* Site Branding */}
          {/* <View className="py-8 items-center">
            <Text className="text-[10px] font-manrope font-extrabold uppercase tracking-[0.4em] text-on-surfaceVariant/30">
              P-wallet Security Protocol V4
            </Text>
          </View> */}
        </View>
      </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Full screen ID Card Scanner Overlay */}
      {isScanningID && (
        <View style={StyleSheet.absoluteFill} className="bg-black z-[100]">
          <IDCardScanner
            onCapture={onIDScanned}
            onClose={() => setIsScanningID(false)}
            isLoading={isLoading}
          />
        </View>
      )}
    </>
  );
}
