import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { PIIService } from './pii.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('pii')
@UseGuards(JwtAuthGuard)
export class PIIController {
  constructor(private piiService: PIIService) {}

  @Post('store/:userId')
  storePII(@Param('userId') userId: string, @Body('field') field: string, @Body('value') value: string) {
    return this.piiService.storePII(userId, field, value);
  }

  @Get('get/:userId/:field')
  getPII(@Param('userId') userId: string, @Param('field') field: string) {
    return this.piiService.getPII(userId, field);
  }

  @Delete('delete/:userId/:field')
  deletePII(@Param('userId') userId: string, @Param('field') field: string) {
    return this.piiService.deletePII(userId, field);
  }
}
