import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { User, MapPin, Mail, Phone, Briefcase, Coins, Target, Check, X } from 'lucide-react-native';
import { MotiView } from 'moti';
import { EditField, EditSelect } from './ProfileUIAtoms';

export interface EditSheetModalProps {
  visible: boolean;
  activeModal: string | null;
  formData: any;
  onClose: () => void;
  onSave: () => void;
  setFormData: (data: any) => void;
}

export function EditSheetModal({
  visible,
  activeModal,
  formData,
  onClose,
  onSave,
  setFormData,
}: EditSheetModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end"
      >
        {/* Backdrop */}
        <View className="absolute inset-0 bg-black/40" />
        <TouchableOpacity activeOpacity={1} onPress={onClose} className="absolute inset-0" />

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
              onPress={onClose}
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
            >
              <X size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="max-h-[60vh]">
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
                        currentAddress: { ...formData.currentAddress, street: v },
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
                            currentAddress: { ...formData.currentAddress, subdistrict: v },
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
                            currentAddress: { ...formData.currentAddress, district: v },
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
                            currentAddress: { ...formData.currentAddress, province: v },
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
                            currentAddress: { ...formData.currentAddress, postalCode: v },
                          })
                        }
                      />
                    </View>
                  </View>
                </View>
              )}

              {activeModal === 'CONTACT' && (
                <View className="gap-y-5">
                  <EditField
                    label="Email Address"
                    icon={<Mail size={18} color="#9ca3af" />}
                    value={formData.email}
                    onChange={(v: string) => setFormData({ ...formData, email: v })}
                  />
                  <EditField
                    label="Mobile Number"
                    icon={<Phone size={18} color="#9ca3af" />}
                    value={formData.phone}
                    onChange={() => {}}
                    disabled
                  />
                  <Text className="text-[10px] font-medium text-gray-400 italic ml-1 leading-tight">
                    Note: Phone number is tied to device binding and KYC verification and cannot be
                    changed here.
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
                    onChange={(v: string) => setFormData({ ...formData, sourceOfIncome: v })}
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
                                workAddress: { ...formData.workAddress, subdistrict: v },
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
                                workAddress: { ...formData.workAddress, district: v },
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
                                workAddress: { ...formData.workAddress, province: v },
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
                                workAddress: { ...formData.workAddress, postalCode: v },
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

            <TouchableOpacity
              onPress={onSave}
              className="w-full h-14 mt-8 rounded-2xl bg-[#f48fb1] flex-row items-center justify-center gap-2 shadow-lg shadow-pink-200 active:scale-95"
            >
              <Check size={20} color="white" />
              <Text className="text-white font-black text-sm">Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </MotiView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
