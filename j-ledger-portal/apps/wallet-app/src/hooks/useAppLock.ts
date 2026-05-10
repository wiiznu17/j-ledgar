import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '@/store/auth';

const LOCK_TIMEOUT_MS = 5000; // 5 seconds as requested

export const useAppLock = () => {
  const appState = useRef(AppState.currentState);
  const lockSession = useAuthStore((state) => state.lockSession);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const needsPinVerification = useAuthStore(
    (state) => state.needsPinVerification,
  );
  const lastActiveAt = useAuthStore((state) => state.lastActiveAt);
  const updateActivity = useAuthStore((state) => state.updateActivity);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        console.log(
          `[AppLock] State changed: ${appState.current} -> ${nextAppState}`,
        );

        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // App has come to the foreground
          const now = Date.now();
          const elapsed = now - lastActiveAt;

          console.log(
            `[AppLock] App returned from background. Elapsed: ${elapsed}ms`,
          );

          if (
            isAuthenticated &&
            !needsPinVerification &&
            elapsed > LOCK_TIMEOUT_MS
          ) {
            console.log(
              '[AppLock] Security timeout reached. Locking session...',
            );
            lockSession();
          } else {
            // Just update activity if we didn't lock
            updateActivity();
          }
        } else if (nextAppState.match(/inactive|background/)) {
          // App is going to background
          updateActivity();
        }

        appState.current = nextAppState;
      },
    );

    return () => {
      subscription.remove();
    };
  }, [
    isAuthenticated,
    needsPinVerification,
    lastActiveAt,
    lockSession,
    updateActivity,
  ]);

  return null;
};
