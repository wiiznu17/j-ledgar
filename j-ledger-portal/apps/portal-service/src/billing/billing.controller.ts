import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('invoices')
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.billingService.createInvoice(createInvoiceDto);
  }

  @Get('invoices')
  findAll(@Request() req: any) {
    const userId = req.user?.sub || req.user?.id || req.query?.userId; 
    return this.billingService.getInvoices(userId);
  }

  @Get('invoices/:id')
  findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id || req.query?.userId;
    return this.billingService.getInvoiceById(id, userId);
  }

  @Post('invoices/:id/pay')
  pay(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id || req.query?.userId;
    return this.billingService.payInvoice(id, userId);
  }
}
