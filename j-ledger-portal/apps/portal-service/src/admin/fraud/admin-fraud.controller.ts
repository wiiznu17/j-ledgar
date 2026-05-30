import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { Permission } from '@repo/dto';
import { FraudService } from '../../modules/fraud/fraud.service';
import { AuditLog } from '../decorators/audit.decorator';
import { ResourceType } from '../../modules/audit/audit.service';

@Controller('admin/fraud-rules')
@UseGuards(AdminJwtGuard, AdminRolesGuard)
export class AdminFraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Get()
  @Permissions(Permission.VIEW_SYSTEM_SETTINGS)
  async findAll() {
    const rules = await this.fraudService.findAll();
    return { data: rules };
  }

  @Get(':id')
  @Permissions(Permission.VIEW_SYSTEM_SETTINGS)
  async findOne(@Param('id') id: string) {
    const rule = await this.fraudService.findOne(id);
    return { data: rule };
  }

  @Post()
  @Permissions(Permission.MANAGE_SYSTEM_SETTINGS)
  @AuditLog(null as any, ResourceType.SYSTEM_SETTINGS, 'Created fraud rule')
  async create(@Body() data: any) {
    const rule = await this.fraudService.create(data);
    return { data: rule };
  }

  @Put(':id')
  @Permissions(Permission.MANAGE_SYSTEM_SETTINGS)
  @AuditLog(null as any, ResourceType.SYSTEM_SETTINGS, 'Updated fraud rule')
  async update(@Param('id') id: string, @Body() data: any) {
    const rule = await this.fraudService.update(id, data);
    return { data: rule };
  }

  @Delete(':id')
  @Permissions(Permission.MANAGE_SYSTEM_SETTINGS)
  @AuditLog(null as any, ResourceType.SYSTEM_SETTINGS, 'Deleted fraud rule')
  async remove(@Param('id') id: string) {
    await this.fraudService.remove(id);
    return { success: true };
  }
}
