import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, Text } from 'react-native';
import { Home, Activity, CreditCard, QrCode } from 'lucide-react-native';

export default function MerchantTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 12,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.03,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: '#f48fb1',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontFamily: 'Manrope-Bold',
          fontSize: 10,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-pink-50 p-2 rounded-xl' : 'p-2'}>
              <Home size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="receive"
        options={{
          title: 'Receive',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-pink-50 p-2 rounded-xl' : 'p-2'}>
              <QrCode size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Sales',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-pink-50 p-2 rounded-xl' : 'p-2'}>
              <Activity size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="terminals"
        options={{
          title: 'Terminals',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-pink-50 p-2 rounded-xl' : 'p-2'}>
              <CreditCard size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
