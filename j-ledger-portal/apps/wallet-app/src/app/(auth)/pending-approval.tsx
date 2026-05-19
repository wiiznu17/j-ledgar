import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth';
import { router } from 'expo-router';
import {
  Clock,
  LogOut,
  RefreshCcw,
  XCircle,
  ArrowRight,
} from 'lucide-react-native';
import { api } from '@/lib/axios';
import { UserStatus } from '@repo/dto';

export default function PendingApprovalScreen() {
  const { logout, user, refreshSession } = useAuthStore();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isRejected = user?.status === UserStatus.REJECTED;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log('[PendingApproval] Refreshing session...');
    try {
      const success = await refreshSession();
      if (success) {
        console.log('[PendingApproval] Session refreshed');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRetry = async () => {
    Alert.alert(
      'Retry Onboarding',
      'This will allow you to re-submit your documents. Are you ready?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Again',
          onPress: async () => {
            setIsRetrying(true);
            try {
              await api.post('/kyc/retry');
              await refreshSession();
              router.replace('/(auth)/onboarding');
            } catch (err: any) {
              Alert.alert(
                'Error',
                err.response?.data?.message ||
                  'Failed to initiate retry. Please try again later.',
              );
            } finally {
              setIsRetrying(false);
            }
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: 'transparent' }}
      edges={['top']}
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: 32,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 96,
            height: 96,
            backgroundColor: isRejected ? '#fee2e2' : '#fce4ec',
            borderRadius: 48,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 32,
          }}
        >
          {isRejected ? (
            <XCircle size={48} color="#ef4444" />
          ) : (
            <Clock size={48} color="#f48fb1" />
          )}
        </View>

        <Text
          style={{
            fontSize: 32,
            fontWeight: '900',
            color: '#1f2937',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          {isRejected ? 'KYC Rejected' : 'Under Review'}
        </Text>

        <Text
          style={{
            fontSize: 18,
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: 24,
          }}
        >
          {isRejected
            ? 'We could not approve your identity verification. Please review the reason below.'
            : 'Your account is currently being verified by our team. This usually takes 24-48 hours.'}
        </Text>

        {isRejected && (
          <View
            style={{
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              padding: 16,
              borderRadius: 16,
              marginBottom: 48,
              borderWidth: 1,
              borderColor: '#fee2e2',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: 'bold',
                color: '#ef4444',
                marginBottom: 4,
                textTransform: 'uppercase',
              }}
            >
              Reason from Admin:
            </Text>
            <Text
              style={{ fontSize: 16, color: '#374151', fontStyle: 'italic' }}
            >
              "
              {user?.reviewNote ||
                'No specific reason provided. Please ensure your documents are clear.'}
              "
            </Text>
          </View>
        )}

        <View style={{ width: '100%' }}>
          {isRejected ? (
            <TouchableOpacity
              onPress={handleRetry}
              disabled={isRetrying}
              style={{
                width: '100%',
                backgroundColor: '#1f2937',
                paddingVertical: 16,
                borderRadius: 20,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
                opacity: isRetrying ? 0.7 : 1,
              }}
            >
              {isRetrying ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <RefreshCcw size={20} color="white" />
                  <Text
                    style={{
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: 18,
                      marginLeft: 8,
                    }}
                  >
                    Retry Verification
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleRefresh}
              disabled={isRefreshing}
              style={{
                width: '100%',
                backgroundColor: '#f48fb1',
                paddingVertical: 16,
                borderRadius: 20,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
                opacity: isRefreshing ? 0.7 : 1,
              }}
            >
              {isRefreshing ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <RefreshCcw size={20} color="white" />
                  <Text
                    style={{
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: 18,
                      marginLeft: 8,
                    }}
                  >
                    Check Status
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleLogout}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              paddingVertical: 16,
              borderRadius: 20,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(0, 0, 0, 0.05)',
            }}
          >
            <LogOut size={20} color="#6b7280" />
            <Text
              style={{
                color: '#6b7280',
                fontWeight: 'bold',
                fontSize: 18,
                marginLeft: 8,
              }}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 48 }}>
          <Text
            style={{
              color: '#9ca3af',
              fontWeight: 'bold',
              fontSize: 12,
              letterSpacing: 1,
            }}
          >
            IDENTITY ID: {user?.id?.slice(0, 8).toUpperCase()}...
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
