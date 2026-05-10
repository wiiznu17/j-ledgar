import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/auth';
import { getStableDeviceId } from '@/lib/device.utils';

// Configure how notifications should be handled when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useNotifications = () => {
  const notificationListener = useRef<Notifications.Subscription | undefined>(
    undefined,
  );
  const responseListener = useRef<Notifications.Subscription | undefined>(
    undefined,
  );
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      registerForPushNotificationsAsync().then((token) => {
        if (token) {
          console.log('[Push] Token received:', token);
          sendTokenToBackend(token);
        }
      });
    }

    // Handle Cold Start
    Notifications.getLastNotificationResponseAsync().then((response) => {
      const url = response?.notification.request.content.data?.url;
      if (typeof url === 'string') handleDeepLink(url);
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log(
          '[Push] Notification received in foreground:',
          notification,
        );
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('[Push] Notification tapped:', response);
        const url = response.notification.request.content.data?.url;
        if (typeof url === 'string') handleDeepLink(url);
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated]);

  const handleDeepLink = (url: string) => {
    console.log('[Push] Navigating to:', url);
    setTimeout(() => {
      try {
        router.push(url as any);
      } catch (err) {
        console.error('[Push] Navigation failed:', err);
      }
    }, 500);
  };

  const sendTokenToBackend = async (pushToken: string) => {
    try {
      const deviceIdentifier = await getStableDeviceId();
      await api.post('/notifications/device/token', {
        deviceIdentifier,
        pushToken,
      });
      console.log('[Push] Token successfully synced with backend');
    } catch (error) {
      console.error('[Push] Failed to sync token with backend', error);
    }
  };

  return null;
};

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'web') {
    return null;
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('[Push] Failed to get push token for push notification!');
      return;
    }

    // Learn more about projectId:
    // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.warn(
        '[Push] No "projectId" found. Ensure it is configured in app.json for push notifications to work.',
      );
      return;
    }

    try {
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
    } catch (e) {
      console.error('[Push] Error getting push token:', e);
    }
  } else {
    console.warn('[Push] Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}
