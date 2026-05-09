import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private expo = new Expo();

  async sendPushNotification(
    pushToken: string,
    title: string,
    body: string,
    data?: any,
  ): Promise<boolean> {
    if (!Expo.isExpoPushToken(pushToken)) {
      this.logger.error(`Push token ${pushToken} is not a valid Expo push token`);
      return false;
    }

    const messages: ExpoPushMessage[] = [
      {
        to: pushToken,
        sound: 'default',
        title,
        body,
        data,
      },
    ];

    try {
      const chunks = this.expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        this.logger.log(`Push notification sent: ${JSON.stringify(ticketChunk)}`);
      }
      return true;
    } catch (error) {
      this.logger.error('Error sending push notification', error);
      return false;
    }
  }
}
