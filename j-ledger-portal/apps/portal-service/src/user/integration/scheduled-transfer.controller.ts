import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../core/common/guards/jwt-auth.guard';
import { ScheduledTransferService } from '../../modules/scheduled-transfer/scheduled-transfer.service';

@Controller('integration/scheduled-transfers')
@UseGuards(JwtAuthGuard)
export class ScheduledTransferController {
  constructor(private readonly scheduledTransferService: ScheduledTransferService) {}

  @Get()
  async findAll(@Req() req: any) {
    const userId = req.user.sub;
    const data = await this.scheduledTransferService.findAll(userId);
    return { data };
  }

  @Post()
  async create(@Req() req: any, @Body() data: any) {
    const userId = req.user.sub;
    const result = await this.scheduledTransferService.create(userId, data);
    return { data: result };
  }

  @Put(':id/cancel')
  async cancel(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub;
    await this.scheduledTransferService.cancel(userId, id);
    return { success: true };
  }
}
