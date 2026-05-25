import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Store,
  FileText,
  Check,
  CheckCircle2,
  User,
  Mail,
  Phone,
  MapPin,
  Tag,
  Camera,
  X,
  ShieldCheck,
  Search,
  Navigation2,
  Plus,
  Image as ImageIcon,
  AlertCircle,
  Maximize2,
  Map as MapIcon,
  LocateFixed,
  Clock,
} from 'lucide-react-native';
import { MerchantService } from '@/lib/merchant-service';
import api from '@/lib/axios';
import { AppSelector } from '@/components/common/AppSelector';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { debounce } from 'lodash';

const MERCHANT_CATEGORIES = [
  { value: 'FOOD_BEVERAGE', label: 'อาหารและเครื่องดื่ม' },
  { value: 'RETAIL', label: 'ค้าปลีกทั่วไป' },
  { value: 'FASHION', label: 'แฟชั่นและเครื่องแต่งกาย' },
  { value: 'ELECTRONICS', label: 'เครื่องใช้ไฟฟ้าและไอที' },
  { value: 'HEALTH_BEAUTY', label: 'สุขภาพและความงาม' },
  { value: 'SERVICES', label: 'การบริการ' },
  { value: 'OTHERS', label: 'อื่นๆ' },
];

const SALES_CHANNELS = [
  { value: 'PHYSICAL_STORE', label: 'หน้าร้าน (Physical Store)' },
];

const ProgressBar = ({ step }: { step: number }) => (
  <View className="px-6 pt-2 mb-6">
    <View className="flex-row justify-between items-center mb-3">
      <Text className="text-[#f48fb1] font-black font-manrope text-[10px] uppercase tracking-widest">
        Step {step} of 3
      </Text>
      <Text className="text-slate-400 font-black text-[10px]">
        {Math.round((step / 3) * 100)}% Complete
      </Text>
    </View>
    <View className="flex-row h-1 bg-slate-100 rounded-full overflow-hidden">
      <View
        className="h-full bg-[#f48fb1]"
        style={{ width: `${(step / 3) * 100}%` }}
      />
    </View>
  </View>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-row justify-between py-2 border-b border-slate-50">
    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
      {label}
    </Text>
    <Text className="text-slate-700 text-[11px] font-black">
      {value || '-'}
    </Text>
  </View>
);

const InputField = ({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  error = '',
  editable = true,
}: any) => (
  <View className="mb-5">
    <View className="flex-row items-center mb-2 ml-1">
      <Icon size={12} color={error ? '#f43f5e' : '#f48fb1'} />
      <Text
        className={`text-[10px] font-black uppercase tracking-widest ml-2 ${error ? 'text-rose-500' : 'text-[#f48fb1]'}`}
      >
        {label}
      </Text>
    </View>
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#cbd5e1"
      keyboardType={keyboardType}
      multiline={multiline}
      editable={editable}
      className={`bg-white px-5 ${multiline ? 'py-4 h-24' : 'py-4'} rounded-2xl font-manrope font-bold text-gray-800 shadow-sm border ${error ? 'border-rose-500' : editable ? 'border-slate-100' : 'border-slate-50 bg-slate-50/50'}`}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
    {error ? (
      <View className="flex-row items-center mt-1.5 ml-2">
        <AlertCircle size={10} color="#f43f5e" />
        <Text className="text-[9px] font-bold text-rose-500 ml-1 italic">
          {error}
        </Text>
      </View>
    ) : null}
  </View>
);

export default function MerchantApply() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const modalMapRef = useRef<MapView>(null);

  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const [form, setForm] = useState({
    businessName: '',
    businessNameEn: '',
    category: '',
    salesChannel: 'PHYSICAL_STORE',
    contactName: '',
    email: '',
    phone: '',
    taxId: Math.floor(1000000000000 + Math.random() * 9000000000000).toString(), // for testing
    address: '', // Auto-filled from map
    addressDetail: '', // Manual input
    latitude: 13.7563,
    longitude: 100.5018,
    ownerIdCardNumber: '',
    ownerBirthDate: '',
    images: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tempCoords, setTempCoords] = useState({
    latitude: 13.7563,
    longitude: 100.5018,
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const getCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Please enable location services in your device settings to auto-locate your store.',
        );
        return;
      }

      const locationData = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (locationData && locationData.coords) {
        const coords = {
          latitude: locationData.coords.latitude,
          longitude: locationData.coords.longitude,
        };
        setTempCoords(coords);

        // If map modal is open, animate the modal map, else animate the main map
        if (showMapModal) {
          modalMapRef.current?.animateToRegion(
            {
              ...coords,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            },
            1000,
          );
        } else {
          mapRef.current?.animateToRegion(
            {
              ...coords,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            },
            1000,
          );
        }

        // Also pre-fill form immediately
        setForm((prev) => ({
          ...prev,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }));
        updateAddressFromCoords(coords.latitude, coords.longitude);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to retrieve your current location.');
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    if (step === 3) {
      getCurrentLocation();
    }
  }, [step]);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    loadUserData();

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const loadUserData = async () => {
    try {
      const res = await api.get('/integration/dashboard');
      const dashboard = res.data;
      setUserData(dashboard.user);

      let prefillPhone = dashboard.user.phone || '';
      if (prefillPhone.startsWith('+66')) {
        prefillPhone = '0' + prefillPhone.substring(3);
      } else if (prefillPhone.startsWith('66') && prefillPhone.length > 10) {
        prefillPhone = '0' + prefillPhone.substring(2);
      }

      setForm((prev) => ({
        ...prev,
        contactName: dashboard.user.name,
        email: dashboard.user.email || '',
        ownerIdCardNumber: dashboard.user.idCardNumber,
        ownerBirthDate: dashboard.user.birthDate,
        phone: prefillPhone.replace(/[^0-9]/g, '').substring(0, 10),
      }));
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const updateAddressFromCoords = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      if (results && results.length > 0) {
        const item = results[0];
        if (item) {
          const readableAddress = [
            item.name,
            item.streetNumber,
            item.street,
            item.district,
            item.subregion,
            item.region,
            item.postalCode,
            item.country,
          ]
            .filter(Boolean)
            .join(', ');

          setForm((prev) => ({ ...prev, address: readableAddress }));
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const searchSuggestions = useCallback(
    debounce(async (text: string) => {
      if (text.length < 3) {
        setSuggestions([]);
        return;
      }
      setIsSearchingMap(true);
      try {
        const results = await Location.geocodeAsync(text);
        if (results && results.length > 0) {
          // Reverse geocode to get readable names for suggestions
          const suggestedItems = await Promise.all(
            results.slice(0, 3).map(async (res) => {
              const reverse = await Location.reverseGeocodeAsync({
                latitude: res.latitude,
                longitude: res.longitude,
              });
              const r = reverse[0];
              return {
                ...res,
                title:
                  [r?.name, r?.street, r?.district, r?.region]
                    .filter(Boolean)
                    .join(', ') || text,
              };
            }),
          );
          setSuggestions(suggestedItems);
        }
      } catch (error) {
        console.error('Suggestion search error:', error);
      } finally {
        setIsSearchingMap(false);
      }
    }, 800),
    [],
  );

  useEffect(() => {
    if (showMapModal) {
      searchSuggestions(searchText);
    }
  }, [searchText, showMapModal]);

  const handleSelectSuggestion = (item: any) => {
    const coords = { latitude: item.latitude, longitude: item.longitude };
    setTempCoords(coords);
    setSearchText(item.title);
    setSuggestions([]);
    modalMapRef.current?.animateToRegion(
      {
        ...coords,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      1000,
    );
    Keyboard.dismiss();
  };

  const handleSearchLocation = async () => {
    if (!searchText) return;
    setIsSearchingMap(true);
    try {
      const results = await Location.geocodeAsync(searchText);
      if (results && results.length > 0 && results[0]) {
        const { latitude, longitude } = results[0];
        setTempCoords({ latitude, longitude });
        modalMapRef.current?.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          1000,
        );
        setSuggestions([]);
      } else {
        Alert.alert('Not Found', 'Could not find this location.');
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearchingMap(false);
    }
  };

  const confirmLocation = () => {
    setForm((prev) => ({
      ...prev,
      latitude: tempCoords.latitude,
      longitude: tempCoords.longitude,
    }));
    updateAddressFromCoords(tempCoords.latitude, tempCoords.longitude);
    setShowMapModal(false);
    setSuggestions([]);
    setSearchText('');
  };

  const pickImage = async () => {
    if (form.images.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 5 images.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Sorry, we need camera roll permissions to make this work!',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedAsset = result.assets[0];
      if (selectedAsset && selectedAsset.uri) {
        setForm((prev) => ({
          ...prev,
          images: [...prev.images, selectedAsset.uri],
        }));
      }
    }
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleChange = (field: string, value: string) => {
    if (field === 'phone' || field === 'taxId') {
      const numericValue = value.replace(/[^0-9]/g, '');
      if (field === 'phone' && numericValue.length <= 10) {
        setForm((prev) => ({ ...prev, [field]: numericValue }));
      } else if (field === 'taxId' && numericValue.length <= 13) {
        setForm((prev) => ({ ...prev, [field]: numericValue }));
      }
      return;
    }

    if (field === 'businessName') {
      const thaiRegex = /^[ก-๙0-9\s!@#$%^&*()_+={}\[\]:;"'<>,.?/-]*$/;
      if (value && !thaiRegex.test(value)) {
        setErrors((prev) => ({
          ...prev,
          businessName: 'Please use Thai characters only.',
        }));
      } else {
        setErrors((prev) => ({ ...prev, businessName: '' }));
      }
    }

    if (field === 'businessNameEn') {
      const engRegex = /^[a-zA-Z0-9\s!@#$%^&*()_+={}\[\]:;"'<>,.?/-]*$/;
      if (value && !engRegex.test(value)) {
        setErrors((prev) => ({
          ...prev,
          businessNameEn: 'Please use English characters only.',
        }));
      } else {
        setErrors((prev) => ({ ...prev, businessNameEn: '' }));
      }
    }

    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (step === 1) {
      if (!form.businessName || !form.category) {
        Alert.alert(
          'Required Fields',
          'Please fill in business name and category.',
        );
        return;
      }
      if (errors.businessName || errors.businessNameEn) {
        Alert.alert(
          'Validation Error',
          'Please fix the errors before continuing.',
        );
        return;
      }
      if (form.phone.length < 9 || form.phone.length > 10) {
        Alert.alert(
          'Invalid Phone',
          'Please enter a valid 9 or 10-digit phone number.',
        );
        return;
      }
    }
    if (step === 2 && !acceptedTerms) {
      Alert.alert(
        'Terms Required',
        'Please accept the terms and conditions to proceed.',
      );
      return;
    }
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleApply = async () => {
    if (!form.address) {
      Alert.alert(
        'Location Required',
        'Please pin your store location on the map.',
      );
      return;
    }
    if (form.images.length < 3) {
      Alert.alert(
        'Photos Required',
        'Please upload at least 3 photos of your storefront.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      form.images.forEach((uri, index) => {
        const filename = uri.split('/').pop() || `image_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('images', {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          name: filename,
          type,
        } as any);
      });

      const uploadRes = await api.post(
        '/merchant/upload-storefront-images',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      const s3Urls = (uploadRes.data.urls || []).map((img: any) =>
        typeof img === 'string' ? img : img.url,
      );

      // Clean up payload: send addressDetail separately now that backend supports it
      const { images, ...restOfForm } = form;

      const payload = {
        ...restOfForm,
        address: form.address,
        addressDetail: form.addressDetail,
        latitude: String(form.latitude),
        longitude: String(form.longitude),
        images: s3Urls,
        ownerIdCardNumber: form.ownerIdCardNumber || '',
      };

      console.log(
        '[Merchant Apply] Submitting payload:',
        JSON.stringify(payload, null, 2),
      );

      await MerchantService.apply(payload);

      setIsSuccess(true);
    } catch (error: any) {
      console.error('[Merchant Apply] Error:', error);

      let errorMessage = 'Failed to submit application. Please try again.';
      const backendMessage = error.response?.data?.message;

      if (Array.isArray(backendMessage)) {
        errorMessage = backendMessage.join('\n');
      } else if (typeof backendMessage === 'string') {
        errorMessage = backendMessage;
      }

      Alert.alert('Registration Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <View className="w-24 h-24 bg-emerald-50 rounded-full items-center justify-center mb-8">
          <CheckCircle2 size={56} color="#10b981" />
        </View>
        <Text className="text-3xl font-black font-manrope text-gray-800 text-center mb-3">
          Success!
        </Text>
        <Text className="text-gray-500 font-bold text-center mb-10 leading-relaxed px-4">
          Application for {form.businessName} submitted. We will review it
          within 1-2 business days.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/merchant' as any)}
          className="bg-gray-900 w-full py-4 rounded-2xl shadow-lg shadow-gray-200"
        >
          <Text className="text-white text-center font-black font-manrope text-lg">
            Go to Dashboard
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      {/* Map Selection Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View className="flex-1 bg-white">
          <View style={{ paddingTop: Math.max(insets.top, 47) }} className="bg-white">
            <View className="z-20">
              <View className="flex-row items-center px-5 pt-4 pb-2">
                <TouchableOpacity
                  onPress={() => {
                    setShowMapModal(false);
                    setSuggestions([]);
                  }}
                  className="p-2"
                >
                  <ChevronLeft size={24} color="#1f2937" />
                </TouchableOpacity>
                <View className="flex-1 flex-row items-center bg-slate-100 px-5 py-3.5 rounded-xl ml-2 border border-slate-200">
                  <Search size={18} color="#f48fb1" />
                  <TextInput
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder="Search location..."
                    className="flex-1 ml-3 font-manrope font-bold text-gray-800 text-base"
                    placeholderTextColor="#94a3b8"
                    onSubmitEditing={handleSearchLocation}
                  />
                  {searchText.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setSearchText('');
                        setSuggestions([]);
                      }}
                      className="p-1"
                    >
                      <X size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
                  {isSearchingMap && (
                    <ActivityIndicator
                      size="small"
                      color="#f48fb1"
                      className="ml-2"
                    />
                  )}
                </View>
              </View>

              {/* Suggestion List Overlay */}
              {suggestions.length > 0 && (
                <View className="absolute top-28 left-6 right-6 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-72 z-30">
                  <ScrollView keyboardShouldPersistTaps="handled">
                    {suggestions.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleSelectSuggestion(item)}
                        className={`flex-row items-center px-5 py-4 border-b border-slate-50 ${index === suggestions.length - 1 ? 'border-b-0' : ''}`}
                      >
                        <View className="w-8 h-8 bg-pink-50 rounded-full items-center justify-center mr-3">
                          <MapPin size={14} color="#f48fb1" />
                        </View>
                        <View className="flex-1">
                          <Text
                            className="text-gray-800 font-bold text-xs"
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                          <Text className="text-slate-400 text-[9px] mt-1">
                            Lat: {item.latitude.toFixed(4)}, Lng:{' '}
                            {item.longitude.toFixed(4)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          <View className="flex-1 relative z-10">
            <MapView
              ref={modalMapRef}
              provider={PROVIDER_DEFAULT}
              style={{ flex: 1 }}
              initialRegion={{
                latitude: tempCoords.latitude,
                longitude: tempCoords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              onPress={(e) => {
                setTempCoords(e.nativeEvent.coordinate);
                setSuggestions([]);
              }}
            >
              <Marker
                coordinate={tempCoords}
                draggable
                onDragEnd={(e) => setTempCoords(e.nativeEvent.coordinate)}
                pinColor="#f48fb1"
              />
            </MapView>

            {/* Locate Me Floating Button */}
            <View className="absolute top-24 right-6">
              <TouchableOpacity
                onPress={getCurrentLocation}
                className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg border border-slate-100 active:scale-95"
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color="#f48fb1" />
                ) : (
                  <LocateFixed size={20} color="#f48fb1" />
                )}
              </TouchableOpacity>
            </View>

            <View className="absolute bottom-10 left-6 right-6">
              <TouchableOpacity
                onPress={confirmLocation}
                className="bg-[#f48fb1] py-4 rounded-[2rem] shadow-2xl shadow-pink-200 flex-row items-center justify-center"
              >
                <LocateFixed size={20} color="white" />
                <Text className="text-white font-black font-manrope text-lg ml-3">
                  Confirm Pin Location
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-2">
        <TouchableOpacity
          onPress={() => (step > 1 ? prevStep() : router.back())}
          className="p-2 bg-white rounded-xl shadow-sm border border-slate-50"
        >
          <ChevronLeft size={20} color="#1f2937" />
        </TouchableOpacity>
        <Text className="text-lg font-black font-manrope text-gray-800">
          Merchant Registration
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <X size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <ProgressBar step={step} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: keyboardHeight > 0 ? keyboardHeight + 100 : 140,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && (
          <View>
            <View className="mb-8">
              <Text className="text-2xl font-black font-manrope text-gray-800 mb-2">
                Business Details
              </Text>
              <Text className="text-slate-400 font-bold text-sm leading-relaxed">
                Complete the form below to apply for a merchant partnership.
              </Text>
            </View>

            <View className="bg-white rounded-3xl p-6 mb-8 shadow-sm border border-slate-100">
              <View className="flex-row items-center mb-4">
                <ShieldCheck size={16} color="#f48fb1" />
                <Text className="text-[10px] font-black text-[#f48fb1] uppercase tracking-widest ml-2">
                  Owner Identity (KYC)
                </Text>
              </View>
              {isLoadingUser ? (
                <ActivityIndicator color="#f48fb1" size="small" />
              ) : (
                <View>
                  <InfoRow label="Full Name" value={userData?.name} />
                  <InfoRow
                    label="ID Card"
                    value={userData?.idCardNumber || '1-3097-****-*-**-*'}
                  />
                  <InfoRow
                    label="Birth Date"
                    value={
                      userData?.birthDate
                        ? new Date(userData.birthDate).toLocaleDateString(
                            'en-US',
                            { day: 'numeric', month: 'long', year: 'numeric' },
                          )
                        : '-'
                    }
                  />
                  <InfoRow
                    label="Phone"
                    value={userData?.phone || '***-***-****'}
                  />
                </View>
              )}
            </View>

            <Text className="text-[10px] font-black text-[#f48fb1] uppercase tracking-[0.2em] mb-4 ml-1">
              Section 1: Store Profile
            </Text>

            <InputField
              label="Business Name (TH)"
              icon={Store}
              value={form.businessName}
              onChange={(v: string) => handleChange('businessName', v)}
              placeholder="ร้านตัวอย่าง"
              error={errors.businessName}
            />

            <InputField
              label="Business Name (EN)"
              icon={Store}
              value={form.businessNameEn}
              onChange={(v: string) => handleChange('businessNameEn', v)}
              placeholder="Example Store"
              error={errors.businessNameEn}
            />

            <InputField
              label="Store Contact Phone"
              icon={Phone}
              value={form.phone}
              onChange={(v: string) => handleChange('phone', v)}
              placeholder="e.g. 0812345678"
              keyboardType="phone-pad"
            />

            <InputField
              label="Tax ID / Registration No."
              icon={FileText}
              value={form.taxId}
              onChange={(v: string) => handleChange('taxId', v)}
              placeholder="13-digit Tax ID"
              keyboardType="numeric"
            />

            <AppSelector
              label="Business Category"
              value={form.category}
              options={MERCHANT_CATEGORIES}
              onSelect={(v) => handleChange('category', v)}
              placeholder="Select Category"
              containerClassName="mb-5"
            />

            <AppSelector
              label="Sales Channel"
              value={form.salesChannel}
              options={SALES_CHANNELS}
              onSelect={(v) => handleChange('salesChannel', v)}
              placeholder="Select Channel"
              containerClassName="mb-5"
            />
          </View>
        )}

        {step === 2 && (
          <View>
            <View className="mb-8">
              <Text className="text-2xl font-black font-manrope text-gray-800 mb-2">
                Agreement
              </Text>
              <Text className="text-slate-400 font-bold text-sm leading-relaxed">
                Review our terms of service for merchant partners.
              </Text>
            </View>

            <View className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-96">
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text className="text-slate-500 font-bold leading-6 text-sm">
                  1. Service Usage: The merchant agrees to use the service
                  solely for receiving payments for legitimate goods and
                  services...
                  {'\n\n'}
                  2. Fees: Transaction fees (MDR) will be applied as specified
                  in the merchant contract...
                  {'\n\n'}
                  3. Security: Merchants must maintain strict confidentiality of
                  terminal keys and access credentials...
                  {'\n\n'}
                  4. Review Period: Verification typically takes 1-3 business
                  days...
                </Text>
              </ScrollView>
            </View>

            <TouchableOpacity
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              className="flex-row items-center mt-8 bg-white p-5 rounded-2xl border border-slate-100"
            >
              <View
                className={`w-6 h-6 rounded-lg items-center justify-center border ${acceptedTerms ? 'bg-[#f48fb1] border-[#f48fb1]' : 'bg-white border-slate-200'}`}
              >
                {acceptedTerms && <Check size={14} color="white" />}
              </View>
              <Text className="ml-3 text-slate-700 font-black font-manrope text-xs">
                I accept the terms and conditions
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View>
            <View className="mb-8">
              <Text className="text-2xl font-black font-manrope text-gray-800 mb-2">
                Store Location & Photos
              </Text>
              <Text className="text-slate-400 font-bold text-sm leading-relaxed">
                Pin your store location and upload some photos.
              </Text>
            </View>

            {/* Address & Map Section */}
            <View className="mb-8">
              <TouchableOpacity
                onPress={() => {
                  setTempCoords({
                    latitude: form.latitude,
                    longitude: form.longitude,
                  });
                  setShowMapModal(true);
                }}
                activeOpacity={0.9}
                className="h-56 rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-100 mb-6"
              >
                <MapView
                  ref={mapRef}
                  provider={PROVIDER_DEFAULT}
                  style={{ flex: 1 }}
                  region={{
                    latitude: form.latitude,
                    longitude: form.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  <Marker
                    coordinate={{
                      latitude: form.latitude,
                      longitude: form.longitude,
                    }}
                    pinColor="#f48fb1"
                  />
                </MapView>
                <View className="absolute inset-0 bg-black/5 items-center justify-center">
                  <View className="bg-white/90 px-4 py-2 rounded-full flex-row items-center shadow-sm">
                    <MapIcon size={14} color="#f48fb1" />
                    <Text className="text-[#f48fb1] font-black text-[10px] ml-2">
                      TAP TO PIN LOCATION
                    </Text>
                  </View>
                </View>
                {isReverseGeocoding && (
                  <View className="absolute inset-0 bg-white/50 items-center justify-center">
                    <ActivityIndicator color="#f48fb1" />
                  </View>
                )}
              </TouchableOpacity>

              <InputField
                label="Full Address (from Map)"
                icon={MapIcon}
                value={form.address}
                placeholder="Pin location on map to get address..."
                multiline
                editable={false}
              />

              <InputField
                label="Address Detail (Floor, Room, etc.)"
                icon={Navigation2}
                value={form.addressDetail}
                onChange={(v: string) => handleChange('addressDetail', v)}
                placeholder="e.g. 2nd Floor, Room 204"
                multiline
              />
            </View>

            {/* Photos Section */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <Camera size={16} color="#f48fb1" />
                  <Text className="text-[10px] font-black text-[#f48fb1] uppercase tracking-widest ml-2">
                    Store Photos
                  </Text>
                </View>
                <Text
                  className={`text-[10px] font-black ${form.images.length >= 3 ? 'text-emerald-500' : 'text-slate-400'}`}
                >
                  {form.images.length} / 5 Images
                </Text>
              </View>

              <View className="flex-row flex-wrap">
                {form.images.map((uri, index) => (
                  <View
                    key={index}
                    className="w-[31%] aspect-square mr-[3%] mb-3 relative"
                  >
                    <Image
                      source={{ uri }}
                      className="w-full h-full rounded-2xl"
                    />
                    <TouchableOpacity
                      onPress={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-rose-500 w-6 h-6 rounded-full items-center justify-center shadow-sm border-2 border-white"
                    >
                      <X size={12} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}

                {form.images.length < 5 && (
                  <TouchableOpacity
                    onPress={pickImage}
                    className="w-[31%] aspect-square bg-white rounded-2xl border-2 border-dashed border-slate-100 items-center justify-center mb-3 shadow-sm"
                  >
                    <Plus size={24} color="#f48fb1" />
                    <Text className="text-pink-400 text-[8px] font-black uppercase mt-1">
                      Add Photo
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {form.images.length < 3 && (
                <View className="flex-row items-center mt-1 ml-1">
                  <ImageIcon size={10} color="#94a3b8" />
                  <Text className="text-[9px] font-bold text-slate-400 ml-1.5 italic">
                    Please upload at least 3 photos
                  </Text>
                </View>
              )}
            </View>

            <View className="bg-pink-50/50 p-5 rounded-2xl border border-pink-100/50 mt-4 flex-row items-start">
              <FileText size={16} color="#f48fb1" className="mt-0.5" />
              <Text className="text-[#f48fb1] text-[11px] font-bold leading-5 ml-3 flex-1">
                Tip: Clear photos and accurate location help speed up the
                approval process.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white/80 p-6 border-t border-slate-50">
        <TouchableOpacity
          onPress={step < 3 ? nextStep : handleApply}
          disabled={
            isSubmitting ||
            (step === 2 && !acceptedTerms) ||
            (step === 3 && (form.images.length < 3 || !form.address))
          }
          className={`py-5 rounded-[2rem] shadow-xl ${isSubmitting || (step === 2 && !acceptedTerms) || (step === 3 && (form.images.length < 3 || !form.address)) ? 'bg-slate-300' : 'bg-gray-900 shadow-slate-200'}`}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-black font-manrope text-lg">
              {step < 3 ? 'Continue' : 'Submit Application'}
            </Text>
          )}
        </TouchableOpacity>
        {step > 1 && (
          <TouchableOpacity onPress={prevStep} className="mt-4">
            <Text className="text-center text-slate-400 font-black font-manrope text-xs uppercase tracking-widest">
              Go Back
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
