import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

@Controller('api/history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  async getHistory(
    @Request() req: ExpressRequest & { user: { userId: string } },
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 0;
    const sizeNum = size ? parseInt(size, 10) : 20;
    
    // The user ID in this system is stored as 'userId' in the JWT payload (req.user.userId)
    // We pass it to the service which will map it to the ledger account
    return this.historyService.getTransactionHistory(req.user.userId, pageNum, sizeNum);
  }
}
