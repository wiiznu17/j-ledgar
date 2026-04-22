import { useNotificationStore, NotificationType } from '../store/notifications';

export interface NotificationPayload {
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, any>;
}

/**
 * Notification Service - Centralized notification handling
 */
export class NotificationService {
  /**
   * Send a notification
   */
  static notify(payload: NotificationPayload) {
    console.log('[Notification Service] Sending notification:', payload);
    useNotificationStore.getState().addNotification({
      title: payload.title,
      body: payload.body,
      type: payload.type,
      data: payload.data,
    });
  }

  /**
   * Transfer success notification
   */
  static transferSuccess(recipientName: string, amount: string) {
    this.notify({
      title: 'Transfer Successful',
      body: `You transferred ฿${amount} to ${recipientName}`,
      type: 'transfer',
      data: { action: 'transfer', status: 'success', recipient: recipientName, amount },
    });
  }

  /**
   * Transfer failed notification
   */
  static transferFailed(reason: string) {
    this.notify({
      title: 'Transfer Failed',
      body: `Transfer could not be completed: ${reason}`,
      type: 'error',
      data: { action: 'transfer', status: 'failed', reason },
    });
  }

  /**
   * Payment received notification
   */
  static paymentReceived(senderName: string, amount: string) {
    this.notify({
      title: 'Payment Received',
      body: `You received ฿${amount} from ${senderName}`,
      type: 'payment',
      data: { action: 'payment', sender: senderName, amount },
    });
  }

  /**
   * Security alert notification
   */
  static securityAlert(message: string) {
    this.notify({
      title: 'Security Alert',
      body: message,
      type: 'security',
      data: { action: 'security_alert' },
    });
  }

  /**
   * Reward points notification
   */
  static rewardPoints(points: number, description: string) {
    this.notify({
      title: 'Reward Points',
      body: `You earned ${points} pts ${description}`,
      type: 'points',
      data: { action: 'reward', points, description },
    });
  }

  /**
   * General info notification
   */
  static info(title: string, message: string) {
    this.notify({
      title,
      body: message,
      type: 'info',
    });
  }

  /**
   * Biometric auth failed notification
   */
  static biometricAuthFailed(attemptsRemaining: number) {
    this.notify({
      title: 'Authentication Failed',
      body: `${attemptsRemaining} attempts remaining before PIN required`,
      type: 'security',
      data: { action: 'auth_failed', attemptsRemaining },
    });
  }

  /**
   * QR scan invalid notification
   */
  static qrInvalid(reason: string) {
    this.notify({
      title: 'Invalid QR Code',
      body: reason,
      type: 'error',
      data: { action: 'qr_scan', status: 'invalid', reason },
    });
  }
}
