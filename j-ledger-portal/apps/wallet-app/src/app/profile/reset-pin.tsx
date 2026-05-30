import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, KeyRound, Mail, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { PINInput } from '@/components/common/PINInput';
import { OtpInputFields } from '@/components/common/OtpInputFields';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/auth';

type ResetPinStep = 'REQUEST_OTP' | 'VERIFY_OTP' | 'NEW_PIN' | 'CONFIRM_PIN' | 'SUCCESS';

export default function ResetPinScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [step, setStep] = useState<ResetPinStep>('REQUEST_OTP');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const maskEmail = (emailStr?: string) => {
    if (!emailStr) return '';
    const [name, domain] = emailStr.split('@');
    if (!name || !domain) return emailStr;
    const maskedName = name.slice(0, 3) + '***' + name.slice(-1);
    return `${maskedName}@${domain}`;
  };

  const handleRequestOtp = async () => {
    setIsLoading(true);
    setError('');
    try {
      await api.post('/identity/pin/reset-request');
      setStep('VERIFY_OTP');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'ไม่สามารถส่ง OTP ได้ กรุณาติดต่อแอดมิน';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('').trim();
    if (otpString.length < 6) {
      setError('กรุณากรอกรหัส OTP ให้ครบ 6 หลัก');
      return;
    }
    
    // We will verify the OTP along with the new PIN in the final step to keep it a clean zero-state.
    // Or we can verify now by storing it locally and moving to the NEW_PIN step.
    // Since reset API is: POST /identity/pin/reset { otp, newPin }
    // We will save the verified OTP locally, move to NEW_PIN and CONFIRM_PIN steps, and send it to BFF at the end!
    // This is super clean and works perfectly with the backend.
    setError('');
    setStep('NEW_PIN');
  };

  const handleNewPinComplete = (pinVal: string) => {
    setError('');
    setStep('CONFIRM_PIN');
  };

  const handleConfirmPinComplete = async (pinVal: string) => {
    if (pinVal !== newPin) {
      setError('รหัส PIN ยืนยันไม่ตรงกับรหัส PIN ใหม่');
      setConfirmPin('');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const otpString = otp.join('').trim();
      await api.post('/identity/pin/reset', {
        otp: otpString,
        newPin,
      });

      // Reset successful!
      setStep('SUCCESS');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'การรีเซ็ตรหัส PIN ล้มเหลว';
      setError(msg);
      // Fallback to OTP step if OTP was invalid
      if (msg.includes('OTP')) {
        setStep('VERIFY_OTP');
        setOtp(['', '', '', '', '', '']);
      } else {
        setConfirmPin('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'REQUEST_OTP':
        return 'ขอรหัส OTP สำหรับรีเซ็ต PIN';
      case 'VERIFY_OTP':
        return 'กรอกรหัสยืนยัน OTP';
      case 'NEW_PIN':
        return 'ตั้งรหัส PIN ใหม่';
      case 'CONFIRM_PIN':
        return 'ยืนยันรหัส PIN ใหม่';
      case 'SUCCESS':
        return 'รีเซ็ตรหัส PIN สำเร็จ';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'REQUEST_OTP':
        return `ระบบจะส่งรหัส OTP ไปยังอีเมลยืนยันของคุณ:\n${maskEmail(user?.email)}`;
      case 'VERIFY_OTP':
        return `กรุณากรอกรหัส OTP 6 หลักที่ได้รับในกล่องข้อความอีเมลของคุณ`;
      case 'NEW_PIN':
        return 'กรุณากำหนดรหัส PIN 6 หลักใหม่ของคุณ';
      case 'CONFIRM_PIN':
        return 'กรุณากรอกรหัส PIN 6 หลักใหม่อีกครั้งเพื่อยืนยันความถูกต้อง';
      case 'SUCCESS':
        return 'คุณสามารถเข้าสู่ระบบและทำรายการด้วยรหัส PIN ใหม่ได้ทันที';
    }
  };

  const getIcon = () => {
    switch (step) {
      case 'REQUEST_OTP':
        return <Mail size={32} color="#f48fb1" />;
      case 'VERIFY_OTP':
        return <KeyRound size={32} color="#f48fb1" />;
      case 'NEW_PIN':
      case 'CONFIRM_PIN':
        return <KeyRound size={32} color="#f48fb1" />;
      case 'SUCCESS':
        return <ShieldCheck size={48} color="#22c55e" />;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6fc]">
      {/* Header */}
      {step !== 'SUCCESS' && (
        <View className="px-6 mt-6 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => {
              if (step === 'VERIFY_OTP') {
                setStep('REQUEST_OTP');
              } else if (step === 'NEW_PIN') {
                setStep('VERIFY_OTP');
              } else if (step === 'CONFIRM_PIN') {
                setStep('NEW_PIN');
                setNewPin('');
              } else {
                router.back();
              }
            }}
            className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm"
          >
            <ChevronLeft size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text className="text-lg font-manrope font-black text-gray-800 tracking-tight">
            Reset Secret PIN
          </Text>
          <View className="w-12" />
        </View>
      )}

      <View className="flex-1 items-center justify-center px-8">
        {/* Step Icon */}
        <View className="w-20 h-20 bg-pink-50 rounded-[2rem] items-center justify-center border border-pink-100 shadow-sm mb-6">
          {getIcon()}
        </View>

        {/* Title */}
        <Text className="text-2xl font-manrope font-black text-gray-800 text-center px-4 mb-2">
          {getStepTitle()}
        </Text>

        {/* Subtitle */}
        <Text className="text-sm font-manrope font-bold text-gray-400 text-center px-6 leading-relaxed mb-8">
          {getStepSubtitle()}
        </Text>

        {/* Error message */}
        {error ? (
          <View className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 w-full max-w-sm">
            <Text className="text-xs text-red-500 font-manrope font-bold text-center leading-relaxed">
              ⚠️ {error}
            </Text>
          </View>
        ) : null}

        {/* Action Content */}
        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#f48fb1" />
            <Text className="text-xs font-manrope font-bold text-gray-400 mt-4">
              กำลังดำเนินการ...
            </Text>
          </View>
        ) : (
          <View className="w-full max-w-xs items-center">
            {step === 'REQUEST_OTP' && (
              <TouchableOpacity
                onPress={handleRequestOtp}
                className="w-full h-14 bg-[#f48fb1] rounded-2xl flex-row items-center justify-center shadow-lg shadow-pink-200 mt-4 active:scale-95 transition-all"
              >
                <Text className="text-white font-manrope font-black text-sm">
                  รับรหัส OTP ทางอีเมล
                </Text>
              </TouchableOpacity>
            )}

            {step === 'VERIFY_OTP' && (
              <View className="w-full">
                <OtpInputFields
                  otp={otp}
                  onOtpChange={(index, val) => {
                    const newOtp = [...otp];
                    newOtp[index] = val;
                    setOtp(newOtp);
                  }}
                  isLoading={false}
                />
                
                <TouchableOpacity
                  disabled={otp.some(d => !d)}
                  onPress={handleVerifyOtp}
                  className={`w-full h-14 rounded-2xl flex-row items-center justify-center shadow-sm mt-8 active:scale-95 transition-all
                    ${otp.some(d => !d) ? 'bg-gray-200' : 'bg-[#f48fb1] shadow-pink-200'}`}
                >
                  <Text className={`font-manrope font-black text-sm ${otp.some(d => !d) ? 'text-gray-400' : 'text-white'}`}>
                    ยืนยันรหัส OTP
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleRequestOtp}
                  className="mt-6 items-center"
                >
                  <Text className="text-gray-400 font-manrope font-bold text-xs underline">
                    ส่งรหัสอีกครั้ง (Resend OTP)
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 'NEW_PIN' && (
              <PINInput
                pin={newPin}
                onPinChange={setNewPin}
                length={6}
                onComplete={handleNewPinComplete}
              />
            )}

            {step === 'CONFIRM_PIN' && (
              <PINInput
                pin={confirmPin}
                onPinChange={setConfirmPin}
                length={6}
                onComplete={handleConfirmPinComplete}
              />
            )}

            {step === 'SUCCESS' && (
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-full h-14 bg-[#f48fb1] rounded-2xl flex-row items-center justify-center shadow-lg shadow-pink-200 mt-6 active:scale-95 transition-all"
              >
                <Text className="text-white font-manrope font-black text-sm">
                  กลับสู่หน้าหลัก
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
