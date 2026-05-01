import { Controller, Get, Patch, Post, Body, Query, UseGuards, Req, Param } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    sid: string;
    did: string;
    jti: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationService.getNotifications(
      req.user.sub,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Patch(':id/read')
  async markAsRead(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.notificationService.markAsRead(req.user.sub, id);
  }

  @Post('device/token')
  async updateDeviceToken(
    @Req() req: AuthenticatedRequest,
    @Body() body: { deviceIdentifier: string; pushToken: string },
  ) {
    return this.notificationService.updateDevicePushToken(
      req.user.sub,
      body.deviceIdentifier,
      body.pushToken,
    );
  }

  @Get('preferences')
  async getPreferences(@Req() req: AuthenticatedRequest) {
    return this.notificationService.getPreferences(req.user.sub);
  }

  @Patch('preferences')
  async updatePreferences(
    @Req() req: AuthenticatedRequest,
    @Body() body: { pushEnabled?: boolean; emailEnabled?: boolean },
  ) {
    return this.notificationService.updatePreferences(req.user.sub, body);
  }
}
