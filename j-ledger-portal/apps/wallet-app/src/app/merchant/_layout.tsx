import React from 'react';
import { Slot, router, usePathname } from 'expo-router';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Home, Activity, CreditCard, QrCode } from 'lucide-react-native';
import { useMerchantStore } from '@/store/merchant';

export default function MerchantLayout() {
  const pathname = usePathname();
  const isMerchant = useMerchantStore((state) => state.isMerchant);

  // Define tabs with their corresponding paths
  const tabs = [
    { name: 'index', label: 'Dashboard', icon: Home, path: '/merchant' },
    {
      name: 'receive',
      label: 'Receive',
      icon: QrCode,
      path: '/merchant/receive',
    },
    {
      name: 'transactions',
      label: 'History',
      icon: Activity,
      path: '/merchant/transactions',
    },
    {
      name: 'terminals',
      label: 'Terminals',
      icon: CreditCard,
      path: '/merchant/terminals',
    },
  ];

  // Helper to check if a tab is active
  const isTabActive = (path: string) => {
    if (path === '/merchant') {
      return pathname === '/merchant' || pathname === '/merchant/';
    }
    return pathname.startsWith(path);
  };

  // Pages where the tab bar should be hidden
  const hideTabBarPages = [
    '/merchant/manual-pay',
    '/merchant/apply',
    '/merchant/payment-confirm',
  ];

  let shouldHideTabBar = hideTabBarPages.some((page) =>
    pathname.startsWith(page),
  );

  // Hide tab bar on the main merchant page if the user is not a merchant yet
  // (the "Become a Partner" or "Pending" screens)
  if (
    !isMerchant &&
    (pathname === '/merchant' || pathname === '/merchant/')
  ) {
    shouldHideTabBar = true;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fe' }}>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>

      {/* Dynamic Tab Bar - Hidden on specific pages */}
      {!shouldHideTabBar && (
        <View
          style={{
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#f1f5f9',
            height: Platform.OS === 'ios' ? 88 : 68,
            paddingBottom: Platform.OS === 'ios' ? 28 : 12,
            paddingTop: 12,
            flexDirection: 'row',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 10,
          }}
        >
          {tabs.map((tab) => {
            const active = isTabActive(tab.path);
            const activeColor = '#f48fb1'; // Pink
            const inactiveColor = '#94a3b8'; // Gray

            return (
              <TouchableOpacity
                key={tab.name}
                onPress={() => router.replace(tab.path as any)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <tab.icon
                  size={20}
                  color={active ? activeColor : inactiveColor}
                />
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: 'Manrope_700Bold',
                    color: active ? activeColor : inactiveColor,
                    marginTop: 4,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
