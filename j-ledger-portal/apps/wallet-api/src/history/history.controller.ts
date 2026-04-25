import { Controller, Get, Query, Request, Param } from '@nestjs/common';
import { HistoryService } from './history.service';
import type { Request as ExpressRequest } from 'express';

@Controller('api/history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  async getHistory(
    @Request() req: ExpressRequest & { user: { sub: string } },
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 0;
    const sizeNum = size ? parseInt(size, 10) : 20;

    return this.historyService.getTransactionHistory(req.user.sub, pageNum, sizeNum);
  }

  @Get(':id')
  async getTransactionDetails(@Param('id') id: string) {
    return this.historyService.getTransactionDetails(id);
  }
}
