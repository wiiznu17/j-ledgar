import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
  };
}

@Controller('api/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAll(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    return this.notificationService.getNotifications(userId);
  }

  @Get('unread')
  @UseGuards(JwtAuthGuard)
  async getUnread(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    return this.notificationService.getUnreadNotifications(userId);
  }

  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }
}
