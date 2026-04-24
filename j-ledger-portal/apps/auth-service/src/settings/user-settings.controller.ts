import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UserSettingsService } from './user-settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class UserSettingsController {
  constructor(private readonly userSettingsService: UserSettingsService) {}

  @Get()
  async getAllSettings(@Request() req) {
    return this.userSettingsService.getAllSettings(req.user.userId);
  }

  @Get(':key')
  async getSetting(@Request() req, @Param('key') key: string) {
    const value = await this.userSettingsService.getSetting(req.user.userId, key);
    return { key, value };
  }

  @Post()
  async setSetting(
    @Request() req,
    @Body('key') key: string,
    @Body('value') value: string,
  ) {
    return this.userSettingsService.setSetting(req.user.userId, key, value);
  }

  @Delete(':key')
  async deleteSetting(@Request() req, @Param('key') key: string) {
    return this.userSettingsService.deleteSetting(req.user.userId, key);
  }

  @Delete()
  async resetSettings(@Request() req) {
    return this.userSettingsService.resetSettings(req.user.userId);
  }
}
