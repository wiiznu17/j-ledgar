import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  User,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  Coins,
  Target,
  Check,
  X,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react-native';
import { MotiView } from 'moti';
import { EditField, EditSelect } from './ProfileUIAtoms';
import { UserProfileService } from '@/lib/user-service';

export interface EditSheetModalProps {
  visible: boolean;
  activeModal: string | null;
  formData: any;
  onClose: () => void;
  onSave: () => void;
  setFormData: (data: any) => void;
  isSaving?: boolean;
}

export function EditSheetModal({
  visible,
  activeModal,
  formData,
  onClose,
  onSave,
  setFormData,
  isSaving,
}: EditSheetModalProps) {
  // Email verification states
  const [emailOtp, setEmailOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // Keep track of the original email to see if it changed
  const [originalEmail, setOriginalEmail] = useState('');
  const [originalVerified, setOriginalVerified] = useState(false);

  useEffect(() => {
    if (visible && activeModal === 'CONTACT') {
      setOriginalEmail(formData.email || '');
      setOriginalVerified(!!formData.emailVerified);
    }
  }, [visible, activeModal]);

  // Reset states when modal visibility changes
  useEffect(() => {
    if (!visible) {
      setEmailOtp('');
      setIsOtpSent(false);
      setIsSendingOtp(false);
      setIsVerifyingOtp(false);
      setVerificationError('');
      setVerificationSuccess(false);
    }
  }, [visible]);

  const handleSendOtp = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      setVerificationError('กรุณากรอกอีเมลที่ถูกต้อง');
      return;
    }
    setVerificationError('');
    setIsSendingOtp(true);
    try {
      const res = await UserProfileService.requestEmailVerification(formData.email);
      if (res.success) {
        setIsOtpSent(true);
        Alert.alert('สำเร็จ', 'ส่งรหัส OTP ไปที่อีเมลของคุณเรียบร้อยแล้ว');
      } else {
        setVerificationError(res.message || 'ไม่สามารถส่ง OTP ได้');
      }
    } catch (err: any) {
      console.error('[Send OTP] Error:', err);
      setVerificationError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการส่ง OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!emailOtp || emailOtp.length !== 6) {
      setVerificationError('กรุณากรอกรหัส OTP 6 หลัก');
      return;
    }
    setVerificationError('');
    setIsVerifyingOtp(true);
    try {
      const res = await UserProfileService.confirmEmailVerification(formData.email, emailOtp);
      if (res.success) {
        setVerificationSuccess(true);
        setFormData({
          ...formData,
          emailVerified: true,
        });
        Alert.alert('สำเร็จ', 'ยืนยันที่อยู่อีเมลของคุณเรียบร้อยแล้ว', [
          {
            text: 'ตกลง',
            onPress: () => {
              onClose();
            },
          },
        ]);
      } else {
        setVerificationError(res.message || 'รหัส OTP ไม่ถูกต้อง');
      }
    } catch (err: any) {
      console.error('[Verify OTP] Error:', err);
      setVerificationError(err.response?.data?.message || 'รหัส OTP ไม่ถูกต้องหรือหมดอายุ');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end"
      >
        {/* Backdrop */}
        <View className="absolute inset-0 bg-black/40" />
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => !isSaving && onClose()}
          className="absolute inset-0"
        />

        {/* Sheet */}
        <MotiView
          from={{ translateY: 600 }}
          animate={{ translateY: visible ? 0 : 600 }}
          transition={{
            type: 'spring',
            damping: 30,
            stiffness: 150,
            overshootClamping: true,
          }}
          className="bg-white rounded-t-[2.5rem] p-6 pb-10 shadow-2xl"
        >
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-2xl font-manrope font-black text-gray-800">
                {activeModal === 'ADDRESS' && 'Current Address'}
                {activeModal === 'CONTACT' && 'Contact Details'}
                {activeModal === 'EMPLOYMENT' && 'Work & Income'}
              </Text>
              <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                Edit Section
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => !isSaving && onClose()}
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
            >
              <X size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            className="max-h-[60vh]"
          >
            <View className="gap-y-5">
              {activeModal === 'ADDRESS' && (
                <View className="gap-y-5">
                  <EditField
                    label="Street / House No."
                    icon={<MapPin size={18} color="#9ca3af" />}
                    value={formData.currentAddress.street}
                    onChange={(v: string) =>
                      setFormData({
                        ...formData,
                        currentAddress: {
                          ...formData.currentAddress,
                          street: v,
                        },
                      })
                    }
                  />
                  <View className="flex-row gap-x-4">
                    <View className="flex-1">
                      <EditField
                        label="Sub-district"
                        icon={<MapPin size={18} color="#9ca3af" />}
                        value={formData.currentAddress.subdistrict}
                        onChange={(v: string) =>
                          setFormData({
                            ...formData,
                            currentAddress: {
                              ...formData.currentAddress,
                              subdistrict: v,
                            },
                          })
                        }
                      />
                    </View>
                    <View className="flex-1">
                      <EditField
                        label="District"
                        icon={<MapPin size={18} color="#9ca3af" />}
                        value={formData.currentAddress.district}
                        onChange={(v: string) =>
                          setFormData({
                            ...formData,
                            currentAddress: {
                              ...formData.currentAddress,
                              district: v,
                            },
                          })
                        }
                      />
                    </View>
                  </View>
                  <View className="flex-row gap-x-4">
                    <View className="flex-1">
                      <EditField
                        label="Province"
                        icon={<MapPin size={18} color="#9ca3af" />}
                        value={formData.currentAddress.province}
                        onChange={(v: string) =>
                          setFormData({
                            ...formData,
                            currentAddress: {
                              ...formData.currentAddress,
                              province: v,
                            },
                          })
                        }
                      />
                    </View>
                    <View className="flex-1">
                      <EditField
                        label="Postal Code"
                        icon={<MapPin size={18} color="#9ca3af" />}
                        value={formData.currentAddress.postalCode}
                        onChange={(v: string) =>
                          setFormData({
                            ...formData,
                            currentAddress: {
                              ...formData.currentAddress,
                              postalCode: v,
                            },
                          })
                        }
                      />
                    </View>
                  </View>
                </View>
              )}

              {activeModal === 'CONTACT' && (
                <View className="gap-y-5">
                  <View className="space-y-1.5 w-full">
                    <View className="flex-row justify-between items-center px-1 mb-1">
                      <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Email Address
                      </Text>
                      {formData.email && (
                        <View className={`px-2 py-0.5 rounded-full flex-row items-center gap-1 ${
                          originalVerified && formData.email.toLowerCase() === originalEmail.toLowerCase()
                            ? 'bg-green-50 border border-green-100'
                            : 'bg-amber-50 border border-amber-100'
                        }`}>
                          {originalVerified && formData.email.toLowerCase() === originalEmail.toLowerCase() ? (
                            <>
                              <ShieldCheck size={10} color="#22c55e" />
                              <Text className="text-[8px] font-black uppercase tracking-widest text-green-600">Verified</Text>
                            </>
                          ) : (
                            <>
                              <AlertCircle size={10} color="#f59e0b" />
                              <Text className="text-[8px] font-black uppercase tracking-widest text-amber-600">Unverified</Text>
                            </>
                          )}
                        </View>
                      )}
                    </View>
                    <View className="h-14 px-4 bg-gray-50 border border-gray-100 rounded-2xl flex-row items-center gap-3">
                      <Mail size={18} color="#9ca3af" />
                      <TextInput
                        value={formData.email}
                        onChangeText={(v: string) => setFormData({ ...formData, email: v })}
                        className="flex-1 font-manrope font-bold text-sm text-gray-800"
                        placeholder="Enter email address"
                        placeholderTextColor="#9ca3af"
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>

                  {/* Send OTP button for unverified email */}
                  {formData.email && !(originalVerified && formData.email.toLowerCase() === originalEmail.toLowerCase()) && (
                    <View className="w-full">
                      {!isOtpSent ? (
                        <TouchableOpacity
                          onPress={handleSendOtp}
                          disabled={isSendingOtp}
                          className="w-full h-12 bg-purple-50 border border-purple-100 rounded-2xl flex-row items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                          {isSendingOtp ? (
                            <ActivityIndicator size="small" color="#BF3FFF" />
                          ) : (
                            <>
                              <Mail size={16} color="#BF3FFF" />
                              <Text className="font-manrope font-black text-xs text-[#BF3FFF]">
                                ขอรหัสยืนยัน OTP ทางอีเมล
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <View className="gap-y-4 bg-purple-50/40 p-4 rounded-[1.8rem] border border-purple-100/40">
                          <Text className="text-[10px] font-black uppercase tracking-widest text-purple-500 ml-1">
                            รหัสยืนยัน OTP (6 หลัก)
                          </Text>
                          <View className="h-14 px-4 bg-white border border-purple-100 rounded-2xl flex-row items-center gap-3">
                            <TextInput
                              value={emailOtp}
                              onChangeText={setEmailOtp}
                              className="flex-1 font-manrope font-black text-center text-lg tracking-widest text-gray-800"
                              placeholder="000000"
                              placeholderTextColor="#d1d5db"
                              keyboardType="number-pad"
                              maxLength={6}
                            />
                          </View>
                          <TouchableOpacity
                            onPress={handleVerifyOtp}
                            disabled={isVerifyingOtp}
                            className="w-full h-12 bg-[#BF3FFF] rounded-2xl flex-row items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-purple-200"
                          >
                            {isVerifyingOtp ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <>
                                <Check size={16} color="white" />
                                <Text className="font-manrope font-black text-xs text-white">
                                  ยืนยันรหัส OTP
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Show verification error */}
                  {verificationError && (
                    <View className="bg-red-50 border border-red-100 p-3 rounded-2xl flex-row items-center gap-2">
                      <AlertCircle size={16} color="#ef4444" />
                      <Text className="flex-1 font-manrope font-bold text-[11px] text-red-500">
                        {verificationError}
                      </Text>
                    </View>
                  )}

                  <EditField
                    label="Mobile Number"
                    icon={<Phone size={18} color="#9ca3af" />}
                    value={formData.phone}
                    onChange={() => {}}
                    disabled
                  />
                  <Text className="text-[10px] font-medium text-gray-400 italic ml-1 leading-tight">
                    Note: Phone number is tied to device binding and KYC
                    verification and cannot be changed here.
                  </Text>
                </View>
              )}

              {activeModal === 'EMPLOYMENT' && (
                <View className="gap-y-5">
                  <EditSelect
                    label="Occupation"
                    icon={<Briefcase size={18} color="#9ca3af" />}
                    value={formData.occupation}
                  />
                  <EditSelect
                    label="Monthly Income"
                    icon={<Coins size={18} color="#9ca3af" />}
                    value={formData.income}
                  />
                  <EditField
                    label="Source of Income"
                    icon={<Coins size={18} color="#9ca3af" />}
                    value={formData.sourceOfIncome}
                    onChange={(v: string) =>
                      setFormData({ ...formData, sourceOfIncome: v })
                    }
                  />
                  <EditSelect
                    label="Usage Purpose"
                    icon={<Target size={18} color="#9ca3af" />}
                    value={formData.purpose}
                  />

                  {/* Work Address Fields */}
                  <View className="mt-4 pt-4 border-t border-gray-100">
                    <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 ml-1">
                      Work / Study Address
                    </Text>
                    <View className="gap-y-5">
                      <EditField
                        label="Work Street / House No."
                        icon={<MapPin size={18} color="#9ca3af" />}
                        value={formData.workAddress.street}
                        onChange={(v: string) =>
                          setFormData({
                            ...formData,
                            workAddress: { ...formData.workAddress, street: v },
                          })
                        }
                      />
                      <View className="flex-row gap-x-4">
                        <View className="flex-1">
                          <EditField
                            label="Sub-district"
                            icon={<MapPin size={18} color="#9ca3af" />}
                            value={formData.workAddress.subdistrict}
                            onChange={(v: string) =>
                              setFormData({
                                ...formData,
                                workAddress: {
                                  ...formData.workAddress,
                                  subdistrict: v,
                                },
                              })
                            }
                          />
                        </View>
                        <View className="flex-1">
                          <EditField
                            label="District"
                            icon={<MapPin size={18} color="#9ca3af" />}
                            value={formData.workAddress.district}
                            onChange={(v: string) =>
                              setFormData({
                                ...formData,
                                workAddress: {
                                  ...formData.workAddress,
                                  district: v,
                                },
                              })
                            }
                          />
                        </View>
                      </View>
                      <View className="flex-row gap-x-4">
                        <View className="flex-1">
                          <EditField
                            label="Province"
                            icon={<MapPin size={18} color="#9ca3af" />}
                            value={formData.workAddress.province}
                            onChange={(v: string) =>
                              setFormData({
                                ...formData,
                                workAddress: {
                                  ...formData.workAddress,
                                  province: v,
                                },
                              })
                            }
                          />
                        </View>
                        <View className="flex-1">
                          <EditField
                            label="Postal Code"
                            icon={<MapPin size={18} color="#9ca3af" />}
                            value={formData.workAddress.postalCode}
                            onChange={(v: string) =>
                              setFormData({
                                ...formData,
                                workAddress: {
                                  ...formData.workAddress,
                                  postalCode: v,
                                },
                              })
                            }
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={onSave}
              disabled={isSaving || (activeModal === 'CONTACT' && formData.email && !(originalVerified && formData.email.toLowerCase() === originalEmail.toLowerCase()))}
              className={`w-full h-14 mt-8 rounded-2xl flex-row items-center justify-center gap-2 shadow-lg active:scale-95 transition-all
                ${isSaving || (activeModal === 'CONTACT' && formData.email && !(originalVerified && formData.email.toLowerCase() === originalEmail.toLowerCase())) 
                  ? 'bg-gray-200 shadow-none' 
                  : 'bg-[#f48fb1] shadow-pink-200'}`}
            >
              {isSaving ? (
                <Text className="text-white font-black text-sm">
                  Saving Changes...
                </Text>
              ) : activeModal === 'CONTACT' && formData.email && !(originalVerified && formData.email.toLowerCase() === originalEmail.toLowerCase()) ? (
                <Text className="text-gray-400 font-manrope font-black text-sm">
                  กรุณายืนยันรหัส OTP เพื่อบันทึกอีเมล
                </Text>
              ) : (
                <>
                  <Check size={20} color="white" />
                  <Text className="text-white font-black text-sm">
                    Save Changes
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </MotiView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
