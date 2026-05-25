import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Switch,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  User,
  Shield,
  Bell,
  LogOut,
  ChevronRight,
  Fingerprint,
  Smartphone,
  CreditCard,
  Store,
} from 'lucide-react-native';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { UserProfileService, UserProfile } from '@/lib/user-service';
import { RegistrationState } from '@repo/dto';
import { api } from '@/lib/axios';
import { authenticateWithBiometric, getBiometricErrorMessage } from '@/lib/biometric-auth';

export default function SettingsScreen() {
  const { logout, biometricEnabled, setBiometricEnabled } = useAuthStore();
  const router = useRouter();

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [isTogglingPush, setIsTogglingPush] = useState(false);

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      const profile = await UserProfileService.getProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('[Profile] Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load push notification preference from backend
  const fetchPreferences = async () => {
    try {
      const res = await api.get('/notifications/preferences');
      setPushNotifs(res.data?.pushEnabled !== false);
    } catch (error) {
      console.error('[Profile] Failed to load notification preferences:', error);
    }
  };

  // Toggle push notification and sync with backend
  const togglePushNotifications = async () => {
    if (isTogglingPush) return;
    const newValue = !pushNotifs;
    // Optimistic update
    setPushNotifs(newValue);
    setIsTogglingPush(true);
    try {
      await api.patch('/notifications/preferences', { pushEnabled: newValue });
    } catch (error) {
      console.error('[Profile] Failed to update push preference:', error);
      // Rollback on failure
      setPushNotifs(!newValue);
    } finally {
      setIsTogglingPush(false);
    }
  };

  // Fetch on mount and when screen is focused
  useEffect(() => {
    fetchProfile();
    fetchPreferences();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, []),
  );

  const handleLogout = () => {
    Alert.alert(
      'ออกจากระบบ',
      'คุณต้องการออกจากระบบใช่หรือไม่?',
      [
        {
          text: 'ยกเลิก',
          style: 'cancel',
        },
        {
          text: 'ออกจากระบบ',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/login' as any);
            } catch (err) {
              console.error('[Profile] Logout failed:', err);
              router.replace('/(auth)/login' as any);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Toggle biometric settings with real hardware authentication check
  const handleToggleBiometric = async () => {
    try {
      if (!biometricEnabled) {
        const result = await authenticateWithBiometric();
        if (result.success) {
          await setBiometricEnabled(true);
          Alert.alert('สำเร็จ', 'เปิดใช้งานสแกนลายนิ้วมือ/ใบหน้าเรียบร้อยแล้ว');
        } else {
          if (result.error && result.error.code !== 'USER_CANCEL') {
            Alert.alert(
              'ยืนยันตัวตนไม่สำเร็จ',
              'อุปกรณ์ของคุณไม่รองรับ หรือยังไม่ได้ลงทะเบียนสแกนลายนิ้วมือ/ใบหน้าบนระบบปฏิบัติการของเครื่อง'
            );
          }
        }
      } else {
        await setBiometricEnabled(false);
        Alert.alert('สำเร็จ', 'ปิดใช้งานสแกนลายนิ้วมือ/ใบหน้าเรียบร้อยแล้ว');
      }
    } catch (error) {
      console.error('[Profile] Biometric toggle error:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเปลี่ยนแปลงการตั้งค่าชีวมาตรได้');
    }
  };

  // Format phone number for display
  const formatPhone = (phone: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10 && digits.startsWith('0')) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  // Get display name from profile
  const getDisplayName = () => {
    // 1. Try KYC Thai Name
    const kycThFirst = userProfile?.kycData?.firstNameTh || '';
    const kycThLast = userProfile?.kycData?.lastNameTh || '';
    const kycThName = `${kycThFirst} ${kycThLast}`.trim();
    if (kycThName) return kycThName;

    // 2. Try KYC English Name
    const kycEnFirst = userProfile?.kycData?.firstNameEn || '';
    const kycEnLast = userProfile?.kycData?.lastNameEn || '';
    const kycEnName = `${kycEnFirst} ${kycEnLast}`.trim();
    if (kycEnName) return kycEnName;

    // 3. Try Profile Name
    const firstName = userProfile?.profile?.firstName || '';
    const lastName = userProfile?.profile?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) return fullName;

    // 4. Fallback to a placeholder (Not phone number to avoid duplication)
    return 'P-wallet User';
  };

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-transparent items-center justify-center"
        edges={['top']}
      >
        <ActivityIndicator size="large" color="#f48fb1" />
        <Text className="text-sm font-manrope font-bold text-gray-400 mt-4">
          กำลังโหลดข้อมูล...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-transparent" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-2 pb-4 items-center justify-center">
        <Text className="text-lg font-black text-gray-800 font-manrope">
          Profile
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card Section */}
        <View className="items-center py-6 mb-4">
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/profile/information' as any)}
            >
              <View className="p-1 border-[3px] border-white rounded-[2.5rem] shadow-sm bg-white">
                <Image
                  source={require('../../../assets/images/logo/logo.png')}
                  className="w-28 h-28 rounded-[2.2rem]"
                />
              </View>
              <View className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#f48fb1] rounded-full items-center justify-center border-4 border-[#f8f9fe] shadow-sm">
                <User size={18} color="white" />
              </View>
            </TouchableOpacity>
          </MotiView>

          <View className="items-center mt-5">
            <Text className="text-2xl font-manrope font-black text-gray-800 tracking-tight">
              {getDisplayName()}
            </Text>
            <Text className="text-sm font-bold text-gray-400 mt-1">
              {formatPhone(userProfile?.phoneNumber || '')}
            </Text>
            {/* <View className="bg-pink-50 px-3 py-1.5 rounded-full mt-3 border border-pink-100">
              <Text className="text-[10px] font-black text-[#f48fb1] uppercase tracking-widest">
                {userProfile?.registrationState === RegistrationState.COMPLETED
                  ? 'Premium Member'
                  : 'Standard Member'}
              </Text>
            </View> */}
          </View>
        </View>

        {/* Business & Merchant */}
        <View className="mb-6">
          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-3">
            Business
          </Text>
          <View className="bg-white rounded-[2rem] border border-gray-50 shadow-sm overflow-hidden">
            <SettingItem
              icon={<Store size={20} color="#f59e0b" />}
              iconBg="bg-amber-50"
              label="Switch to Merchant Mode"
              onPress={() => router.push('/merchant' as any)}
            />
          </View>
        </View>

        {/* Account Settings */}
        <View className="mb-6">
          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-3">
            Account Settings
          </Text>
          <View className="bg-white rounded-[2rem] border border-gray-50 shadow-sm overflow-hidden">
            <SettingItem
              icon={<User size={20} color="#3b82f6" />}
              iconBg="bg-blue-50"
              label="My Information Profile"
              onPress={() => router.push('/profile/information' as any)}
            />
          </View>
        </View>

        {/* Security & Privacy */}
        <View className="mb-6">
          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-3">
            Security & Privacy
          </Text>
          <View className="bg-white rounded-[2rem] border border-gray-50 shadow-sm overflow-hidden">
            <SettingItem
              icon={<Shield size={20} color="#3b82f6" />}
              iconBg="bg-blue-50"
              label="Change Security PIN"
              onPress={() => {}}
              badge="Coming Soon"
            />
            <Divider />
            <ToggleSetting
              icon={<Fingerprint size={20} color="#a855f7" />}
              iconBg="bg-purple-50"
              label="Biometric ID"
              active={biometricEnabled}
              onToggle={handleToggleBiometric}
            />
            <Divider />
            <SettingItem
              icon={<LogOut size={20} color="#ef4444" />}
              iconBg="bg-red-50"
              label="Delete Account"
              onPress={() => {}}
              badge="Coming Soon"
            />
          </View>
        </View>

        {/* Preferences */}
        <View className="mb-6">
          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-3">
            Preferences
          </Text>
          <View className="bg-white rounded-[2rem] border border-gray-50 shadow-sm overflow-hidden">
            <ToggleSetting
              icon={<Bell size={20} color="#f97316" />}
              iconBg="bg-orange-50"
              label="Push Notifications"
              active={pushNotifs}
              onToggle={togglePushNotifications}
              disabled={isTogglingPush}
            />
            <Divider />
            <SettingItem
              icon={<CreditCard size={20} color="#14b8a6" />}
              iconBg="bg-teal-50"
              label="Linked Cards"
              onPress={() => {}}
              badge="Coming Soon"
            />
          </View>
        </View>

        {/* Support */}
        <View className="mb-8">
          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-3">
            Support
          </Text>
          <View className="bg-white rounded-[2rem] border border-gray-50 shadow-sm overflow-hidden">
            <SettingItem
              icon={<Bell size={20} color="#3b82f6" />}
              iconBg="bg-blue-50"
              label="Help & Support"
              onPress={() => {}}
              badge="Coming Soon"
            />
            <Divider />
            <SettingItem
              icon={<Shield size={20} color="#64748b" />}
              iconBg="bg-slate-50"
              label="Privacy Policy"
              onPress={() => {}}
              badge="Coming Soon"
            />
            <Divider />
            <SettingItem
              icon={<Shield size={20} color="#64748b" />}
              iconBg="bg-slate-50"
              label="Terms of Service"
              onPress={() => {}}
              badge="Coming Soon"
            />
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="w-full bg-white border border-gray-100 py-4 rounded-[1.5rem] flex-row items-center justify-center gap-3 shadow-sm active:scale-95 mb-6"
        >
          <LogOut size={20} color="#f48fb1" />
          <Text className="font-manrope font-black text-[#f48fb1] text-base">
            Sign Out
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// --- Reusable Components ---

function SettingItem({ icon, iconBg, label, onPress, badge, disabled }: any) {
  const isActuallyDisabled = disabled || badge === 'Coming Soon';
  return (
    <TouchableOpacity
      onPress={isActuallyDisabled ? undefined : onPress}
      activeOpacity={isActuallyDisabled ? 1 : 0.7}
      className={`w-full px-5 py-4 flex-row items-center justify-between bg-white ${isActuallyDisabled ? 'opacity-65' : ''}`}
    >
      <View className="flex-row items-center gap-4">
        <View
          className={`w-10 h-10 rounded-2xl items-center justify-center ${isActuallyDisabled ? 'bg-gray-50' : iconBg}`}
        >
          {isActuallyDisabled ? (
            React.cloneElement(icon, { color: '#9ca3af' })
          ) : (
            icon
          )}
        </View>
        <Text className={`font-manrope font-black text-sm ${isActuallyDisabled ? 'text-gray-400' : 'text-gray-800'}`}>
          {label}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        {badge && (
          <View className="bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200/40">
            <Text className="text-[8px] font-manrope font-black text-gray-400 uppercase tracking-widest">
              {badge}
            </Text>
          </View>
        )}
        <ChevronRight size={18} color={isActuallyDisabled ? '#e5e7eb' : '#d1d5db'} />
      </View>
    </TouchableOpacity>
  );
}

function ToggleSetting({ icon, iconBg, label, active, onToggle, disabled }: any) {
  return (
    <View className="w-full px-5 py-4 flex-row items-center justify-between bg-white">
      <View className="flex-row items-center gap-4">
        <View
          className={`w-10 h-10 rounded-2xl items-center justify-center ${iconBg}`}
        >
          {icon}
        </View>
        <Text className="font-manrope font-black text-sm text-gray-800">
          {label}
        </Text>
      </View>
      <Switch
        value={active}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: '#f3f4f6', true: '#f48fb1' }}
        thumbColor={Platform.OS === 'ios' ? undefined : '#ffffff'}
      />
    </View>
  );
}

function Divider() {
  return <View className="h-[1px] bg-gray-50 mx-5" />;
}
