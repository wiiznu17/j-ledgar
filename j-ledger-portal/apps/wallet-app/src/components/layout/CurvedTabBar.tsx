import React from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, Platform } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { Home, History, QrCode, TicketPercent, User } from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';
import { MotiView } from 'moti';

import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');

import * as Haptics from 'expo-haptics';

export function CurvedTabBar(props: BottomTabBarProps) {
  const router = useRouter();
  const pathname = usePathname() as string;

  const handlePress = (route: string) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    router.push(route as any);
  };

  const getPath = () => {
    const left = (width - 80) / 2;
    return `
      M0,20
      L${left - 20},20
      C${left - 10},20 ${left},10 ${left},0
      L${left},0
      C${left},0 ${left},0 ${left + 40},0
      C${left + 80},0 ${left + 80},0 ${left + 80},0
      L${left + 80},0
      C${left + 80},10 ${left + 90},20 ${left + 100},20
      L${width},20
      L${width},120
      L0,120
      Z
    `;
  };

  const navItems = [
    { name: 'Home', icon: Home, route: '/(tabs)' },
    { name: 'Finance', icon: History, route: '/(tabs)/history' },
    { name: 'Pay', icon: QrCode, route: '/(tabs)/scan', isCenter: true },
    { name: 'Deals', icon: TicketPercent, route: '/deals' },
    { name: 'Me', icon: User, route: '/(tabs)/profile' },
  ];

  return (
    <View style={styles.container}>
      <Svg width={width} height={120} style={styles.svg}>
        <Path
          d={getPath()}
          fill="white"
          stroke="rgba(0,0,0,0.05)"
          strokeWidth={1}
        />
      </Svg>

      <View className="flex-row items-center justify-around w-full px-2 absolute bottom-6 h-16">
        {navItems.map((item, index) => {
          const isActive = pathname === item.route || (item.route === '/(tabs)' && pathname === '/');
          
          if (item.isCenter) {
            return (
              <View key={index} className="items-center">
                <TouchableOpacity
                  onPress={() => handlePress(item.route)}
                  activeOpacity={0.9}
                  style={styles.scanButton}
                  className="bg-primary items-center justify-center shadow-xl shadow-primary/40 -mt-12"
                >
                  <item.icon size={32} color="white" strokeWidth={3} />
                </TouchableOpacity>
                <Text className="font-manrope text-[10px] font-black text-on-surface uppercase tracking-widest mt-1">PAY</Text>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={index}
              onPress={() => handlePress(item.route)}
              className="items-center justify-center px-4"
            >
              <MotiView
                animate={{ 
                   scale: isActive ? 1.1 : 1,
                   opacity: isActive ? 1 : 0.4
                }}
                className="items-center"
              >
                <item.icon size={24} color={isActive ? "#f48fb1" : "#595b61"} strokeWidth={isActive ? 2.5 : 2} />
                <Text 
                  className={`font-manrope text-[10px] font-bold mt-1 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}
                >
                  {item.name}
                </Text>
              </MotiView>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: width,
    height: 120,
    backgroundColor: 'transparent',
    zIndex: 100,
  },
  svg: {
    position: 'absolute',
    bottom: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -10,
    },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 10,
  },
  scanButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    zIndex: 101,
  }
});
