import React from 'react';
import { Tabs } from 'expo-router';
import { CurvedTabBar } from '@/components/layout/CurvedTabBar';

/**
 * TabLayout handles the bottom navigation using a custom CurvedTabBar.
 */
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CurvedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="deals"
        options={{
          title: 'Deals',
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
