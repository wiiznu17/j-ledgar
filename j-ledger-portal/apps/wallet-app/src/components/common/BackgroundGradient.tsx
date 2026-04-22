import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export function BackgroundGradient({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f8cec2', '#c9cfff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Blurred Blobs - Static as requested */}
      <View
        style={[
          styles.blob,
          { top: -100, left: -100, backgroundColor: 'rgba(244, 143, 177, 0.15)' },
        ]}
      />
      <View
        style={[
          styles.blob,
          { bottom: -100, right: -100, backgroundColor: 'rgba(72, 85, 165, 0.1)' },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blob: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.6,
    // Note: Blur is handled by the overall aesthetics/glass elements
    // but we can use a very large blur for the blobs themselves if needed
  },
});
