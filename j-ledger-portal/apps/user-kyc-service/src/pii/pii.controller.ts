import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { PIIService } from './pii.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorePIIDto } from './dto/store-pii.dto';
import { UpdatePIIDto } from './dto/update-pii.dto';

@Controller('kyc/pii')
@UseGuards(JwtAuthGuard)
export class PIIController {
  constructor(private piiService: PIIService) {}

  @Post('store')
  storePII(@Body() dto: StorePIIDto) {
    return this.piiService.storePII(dto.userId, dto.field, dto.value);
  }

  @Put('update/:userId')
  updatePII(@Param('userId') userId: string, @Body() dto: UpdatePIIDto) {
    return this.piiService.updatePII(userId, dto.field, dto.value);
  }

  @Get('get/:userId/:field')
  getPII(@Param('userId') userId: string, @Param('field') field: string) {
    return this.piiService.getPII(userId, field);
  }

  @Delete('delete/:userId/:field')
  deletePII(@Param('userId') userId: string, @Param('field') field: string) {
    return this.piiService.deletePII(userId, field);
  }

  @Post('tax-id/:userId')
  storeTaxId(@Param('userId') userId: string, @Body('taxId') taxId: string) {
    return this.piiService.storeTaxId(userId, taxId);
  }

  @Get('tax-id/:userId')
  getTaxId(@Param('userId') userId: string) {
    return this.piiService.getTaxId(userId);
  }
}
