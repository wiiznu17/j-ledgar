import { Injectable } from '@nestjs/common';
import { NotificationProxyService } from '../notification-proxy/notification-proxy.service';
import { UserService } from '../user/user.service';

@Injectable()
export class NotificationService {
  constructor(
    private notificationProxy: NotificationProxyService,
    private userService: UserService,
  ) {}

  async getNotifications(userId: string) {
    return this.notificationProxy.getNotifications(userId);
  }

  async getUnreadNotifications(userId: string) {
    return this.notificationProxy.getUnreadNotifications(userId);
  }

  async markAsRead(notificationId: string) {
    return this.notificationProxy.markAsRead(notificationId);
  }
}
