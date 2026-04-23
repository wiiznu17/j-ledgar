import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NotificationProxyService {
  private readonly notificationServiceUrl: string;
  private readonly internalSecret: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.notificationServiceUrl = this.configService.get<string>('NOTIFICATION_SERVICE_URL') || 'http://localhost:8082';
    this.internalSecret = this.configService.get<string>('JLEDGER_INTERNAL_SECRET') || 'jledger_ecosystem_secret_2024';
  }

  private getHeaders() {
    return {
      'X-Internal-Secret': this.internalSecret,
      'Content-Type': 'application/json',
    };
  }

  async getNotifications(userId: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.notificationServiceUrl}/api/v1/notifications/${userId}`, {
        headers: this.getHeaders(),
      }),
    );
    return response.data;
  }

  async getUnreadNotifications(userId: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.notificationServiceUrl}/api/v1/notifications/${userId}/unread`, {
        headers: this.getHeaders(),
      }),
    );
    return response.data;
  }

  async markAsRead(notificationId: string) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.notificationServiceUrl}/api/v1/notifications/${notificationId}/read`, {}, {
        headers: this.getHeaders(),
      }),
    );
    return response.data;
  }
}
