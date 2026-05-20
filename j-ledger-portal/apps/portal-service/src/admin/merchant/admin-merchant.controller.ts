import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MerchantService } from '../../modules/merchant/merchant.service';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AdminPermissionsGuard } from '../guards/admin-permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { Permission } from '@repo/dto';

import { ReviewApplicationDto } from './dto/review-application.dto';
import { UpdatePartnerStatusDto } from './dto/update-partner-status.dto';
import { CreateTerminalDto } from './dto/create-terminal.dto';
import { CreatePartnerDto, UpdatePartnerDto } from './dto/create-partner.dto';

@Controller('admin/merchants')
@UseGuards(AdminJwtGuard, AdminPermissionsGuard)
export class AdminMerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Post('partners')
  @Permissions(Permission.MANAGE_MERCHANTS)
  async createPartner(@Body() body: CreatePartnerDto) {
    return this.merchantService.createPartnerManual(body);
  }

  @Get('partners')
  @Permissions(Permission.VIEW_MERCHANTS)
  async getAllPartners(@Query() query: any) {
    return this.merchantService.findAllPartners(query);
  }

  @Get('applications')
  @Permissions(Permission.VIEW_MERCHANT_APPLICATIONS)
  async getApplications(@Query() query: any) {
    return this.merchantService.findApplications(query);
  }

  @Put('applications/:id/review')
  @Permissions(Permission.APPROVE_MERCHANTS)
  async reviewApplication(
    @Param('id') id: string,
    @Body() body: ReviewApplicationDto,
  ) {
    return this.merchantService.reviewApplication(id, body);
  }

  @Put('partners/:id/status')
  @Permissions(Permission.MANAGE_MERCHANTS)
  async updatePartnerStatus(
    @Param('id') id: string,
    @Body() body: UpdatePartnerStatusDto,
  ) {
    return this.merchantService.updatePartnerStatus(id, body.status);
  }

  @Get('partners/:id')
  @Permissions(Permission.VIEW_MERCHANTS)
  async getPartnerDetail(@Param('id') id: string) {
    return this.merchantService.findPartnerById(id);
  }

  @Put('partners/:id')
  @Permissions(Permission.MANAGE_MERCHANTS)
  async updatePartner(@Param('id') id: string, @Body() body: UpdatePartnerDto) {
    return this.merchantService.updatePartner(id, body);
  }

  @Get('partners/:id/merchants')
  @Permissions(Permission.VIEW_MERCHANTS)
  async getPartnerMerchants(@Param('id') id: string) {
    return this.merchantService.findPartnerMerchants(id);
  }

  @Post(':merchantId/terminals')
  @Permissions(Permission.MANAGE_MERCHANTS)
  async createTerminal(
    @Param('merchantId') merchantId: string,
    @Body() body: CreateTerminalDto,
  ) {
    return this.merchantService.createTerminal(merchantId, body);
  }

  @Get(':merchantId/terminals')
  @Permissions(Permission.VIEW_MERCHANTS)
  async getMerchantTerminals(@Param('merchantId') merchantId: string) {
    return this.merchantService.findTerminalsByMerchantId(merchantId);
  }

  @Post('partners/:id/merchants')
  @Permissions(Permission.MANAGE_MERCHANTS)
  async createMerchant(
    @Param('id') partnerId: string,
    @Body() body: { name: string; address?: string },
  ) {
    return this.merchantService.createMerchant(partnerId, body);
  }

  @Post('terminals/:id/rotate')
  @Permissions(Permission.MANAGE_MERCHANTS)
  async rotateSecret(@Param('id') terminalId: string) {
    return this.merchantService.rotateTerminalSecret(terminalId);
  }
}
