import React from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, Platform } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { Home, History, QrCode, TicketPercent, User } from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');

export function CurvedTabBar(props: BottomTabBarProps) {
  const router = useRouter();
  const pathname = usePathname() as string;
  const insets = useSafeAreaInsets();

  // จัดการ Safe Area ด้านล่าง ป้องกันการโดนขอบจอทับ
  const bottomInset = insets.bottom > 0 ? insets.bottom : 16;
  const tabHeight = 65; // ความสูงของแถบเมนู (ส่วนสีขาว)
  const topOffset = 45; // พื้นที่โปร่งใสเหนือแถบเมนู (กันปุ่มลอยโดนตัด)
  const totalHeight = tabHeight + bottomInset + topOffset;

  const handlePress = (route: string) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    router.push(route as any);
  };

  const getPath = () => {
    const cx = width / 2;
    const holeWidth = 96; // ความกว้างของหลุมเว้า
    const holeDepth = 44; // ความลึกของหลุม
    const leftX = cx - holeWidth / 2;
    const rightX = cx + holeWidth / 2;
    const startY = topOffset;

    // เส้นวาดหลุมเว้า (Concave Curve) ให้เนียนไปกับปุ่ม
    return `
      M0,${startY}
      L${leftX - 25},${startY}
      C${leftX},${startY} ${leftX},${startY + holeDepth} ${cx},${startY + holeDepth}
      C${rightX},${startY + holeDepth} ${rightX},${startY} ${rightX + 25},${startY}
      L${width},${startY}
      L${width},${totalHeight}
      L0,${totalHeight}
      Z
    `;
  };

  const navItems = [
    { name: 'Home', icon: Home, route: '/(tabs)' },
    { name: 'History', icon: History, route: '/(tabs)/history' },
    { name: 'Pay', icon: QrCode, route: '/(tabs)/scan', isCenter: true },
    { name: 'Deals', icon: TicketPercent, route: '/deals' },
    { name: 'Me', icon: User, route: '/(tabs)/profile' },
  ];

  return (
    // box-none ทำให้กดทะลุพื้นที่โปร่งใสส่วนบนลงไปโดนเนื้อหาข้างหลังได้
    <View style={[styles.container, { height: totalHeight }]} pointerEvents="box-none">
      {/* 1. Background SVG Layer */}
      <Svg width={width} height={totalHeight} style={styles.svg} pointerEvents="none">
        <Path d={getPath()} fill="#ffffff" stroke="#f3f4f6" strokeWidth={1.5} />
      </Svg>

      {/* 2. Navigation Items Layer */}
      <View
        style={[
          styles.navContainer,
          { height: tabHeight + bottomInset, paddingBottom: bottomInset, marginTop: topOffset },
        ]}
      >
        {navItems.map((item, index) => {
          // ตรวจสอบว่าเป็นหน้าปัจจุบันหรือไม่ (รองรับทั้งแบบมีและไม่มี /(tabs))
          const isActive =
            pathname === item.route ||
            pathname === item.route.replace('/(tabs)', '') ||
            (item.route === '/(tabs)' && pathname === '/');

          if (item.isCenter) {
            // เว้นที่ว่างหลุมตรงกลางไว้
            return <View key={index} style={{ width: width / 5 }} pointerEvents="none" />;
          }

          return (
            <TouchableOpacity
              key={index}
              onPress={() => handlePress(item.route)}
              className="items-center justify-center flex-1"
            >
              <MotiView animate={{ scale: isActive ? 1.05 : 1 }} className="items-center">
                <item.icon
                  size={24}
                  color={isActive ? '#f48fb1' : '#9ca3af'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <Text
                  className={`text-[10px] font-bold mt-1 tracking-wide ${isActive ? 'text-pink-400' : 'text-gray-400'}`}
                >
                  {item.name}
                </Text>
              </MotiView>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Floating Button Layer (จัดให้อยู่ใน Container เสมอ) */}
      {/* top: 13 คือระยะกึ่งกลางของปุ่ม (64px) ให้อยู่พอดีกับเส้น startY (45px) -> 45 - 32 = 13 */}
      <View
        style={[styles.floatingButtonContainer, { top: topOffset - 32 }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          onPress={() => handlePress('/(tabs)/scan')}
          activeOpacity={0.9}
          style={styles.scanButton}
          className="bg-pink-400 items-center justify-center shadow-lg shadow-pink-300"
        >
          <QrCode size={28} color="white" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: width,
    backgroundColor: 'transparent',
    zIndex: 100,
  },
  svg: {
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 10, // เพิ่ม Elevation สำหรับ Android
  },
  navContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 101,
  },
  floatingButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 102,
  },
  scanButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#ffffff', // ขอบสีขาวหนา 4px ให้ปุ่มดูเด่นและกลืนไปกับหลุม
    elevation: 8,
  },
});
