import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useAuthStore } from '@/store/auth';
import { router } from 'expo-router';
import { Clock, LogOut, RefreshCcw } from 'lucide-react-native';

export default function PendingApprovalScreen() {
  const { logout, user, refreshSession } = useAuthStore();

  const handleRefresh = async () => {
    console.log('[PendingApproval] Refreshing session...');
    const success = await refreshSession();
    if (success) {
      console.log('[PendingApproval] Session refreshed');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1, paddingHorizontal: 32, justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{ 
            width: 96, 
            height: 96, 
            backgroundColor: '#fce4ec', 
            borderRadius: 48, 
            justifyContent: 'center', 
            alignItems: 'center', 
            marginBottom: 32 
          }}
        >
          <Clock size={48} color="#f48fb1" />
        </View>

        <Text style={{ fontSize: 32, fontWeight: '900', color: '#1f2937', textAlign: 'center', marginBottom: 16 }}>
          Under Review
        </Text>
        
        <Text style={{ fontSize: 18, color: '#6b7280', textAlign: 'center', marginBottom: 48 }}>
          Your account is currently being verified by our team. This usually takes 24-48 hours.
        </Text>

        <View style={{ width: '100%' }}>
          <TouchableOpacity 
            onPress={handleRefresh}
            style={{ 
              width: '100%', 
              backgroundColor: '#f48fb1', 
              paddingVertical: 16, 
              borderRadius: 20, 
              flexDirection: 'row', 
              justifyContent: 'center', 
              alignItems: 'center',
              marginBottom: 16,
              shadowColor: '#f48fb1',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5
            }}
          >
            <RefreshCcw size={20} color="white" />
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18, marginLeft: 8 }}>Check Status</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleLogout}
            style={{ 
              width: '100%', 
              backgroundColor: '#f9fafb', 
              paddingVertical: 16, 
              borderRadius: 20, 
              flexDirection: 'row', 
              justifyContent: 'center', 
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#f3f4f6'
            }}
          >
            <LogOut size={20} color="#6b7280" />
            <Text style={{ color: '#6b7280', fontWeight: 'bold', fontSize: 18, marginLeft: 8 }}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 48 }}>
          <Text style={{ color: '#9ca3af', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 }}>
            IDENTITY ID: {user?.id?.slice(0, 8).toUpperCase()}...
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
