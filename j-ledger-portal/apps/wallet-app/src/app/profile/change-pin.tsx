import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Lock, KeyRound, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { PINInput } from '@/components/common/PINInput';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/auth';

type ChangePinStep = 'OLD_PIN' | 'NEW_PIN' | 'CONFIRM_PIN' | 'SUCCESS';

export default function ChangePinScreen() {
  const router = useRouter();
  const [step, setStep] = useState<ChangePinStep>('OLD_PIN');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOldPinComplete = async (pinVal: string) => {
    setIsLoading(true);
    setError('');
    try {
      // Validate old PIN against the backend
      const deviceId = await require('@/lib/device.utils').getStableDeviceId();
      const deviceName = require('@/lib/device.utils').getDeviceName();
      
      await api.post('/identity/pin/verify', {
        pin: pinVal,
        deviceId,
        deviceName,
      });

      // PIN is valid, go to NEW_PIN step
      setStep('NEW_PIN');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'รหัส PIN เดิมไม่ถูกต้อง';
      setError(msg);
      setOldPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPinComplete = (pinVal: string) => {
    if (pinVal === oldPin) {
      setError('รหัส PIN ใหม่ต้องไม่ซ้ำกับรหัส PIN เดิม');
      setNewPin('');
      return;
    }
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
      await api.post('/identity/pin/change', {
        oldPin,
        newPin,
      });

      setStep('SUCCESS');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'ไม่สามารถเปลี่ยนรหัส PIN ได้';
      setError(msg);
      setConfirmPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'OLD_PIN':
        return 'ยืนยันรหัส PIN เดิม';
      case 'NEW_PIN':
        return 'ตั้งรหัส PIN ใหม่';
      case 'CONFIRM_PIN':
        return 'ยืนยันรหัส PIN ใหม่';
      case 'SUCCESS':
        return 'เปลี่ยนรหัส PIN สำเร็จ';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'OLD_PIN':
        return 'กรุณากรอกรหัส PIN 6 หลักเดิมของคุณเพื่อยืนยันตัวตน';
      case 'NEW_PIN':
        return 'กรุณากำหนดรหัส PIN 6 หลักใหม่ที่คุณต้องการใช้งาน';
      case 'CONFIRM_PIN':
        return 'กรุณากรอกรหัส PIN 6 หลักใหม่อีกครั้งเพื่อยืนยันความถูกต้อง';
      case 'SUCCESS':
        return 'ระบบได้อัปเดตรหัส PIN ใหม่ของคุณเรียบร้อยแล้ว';
    }
  };

  const getIcon = () => {
    switch (step) {
      case 'OLD_PIN':
        return <Lock size={32} color="#f48fb1" />;
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
              if (step === 'NEW_PIN') {
                setStep('OLD_PIN');
                setOldPin('');
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
            Change Secret PIN
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

        {/* PIN Inputs */}
        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#f48fb1" />
            <Text className="text-xs font-manrope font-bold text-gray-400 mt-4">
              กำลังดำเนินการ...
            </Text>
          </View>
        ) : (
          <View className="w-full max-w-xs">
            {step === 'OLD_PIN' && (
              <PINInput
                pin={oldPin}
                onPinChange={setOldPin}
                length={6}
                onComplete={handleOldPinComplete}
              />
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
