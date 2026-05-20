import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { StorageService } from '../../core/storage/storage.service';

@Controller('admin/common')
@UseGuards(AdminJwtGuard)
export class AdminCommonController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const { url, key } = await this.storageService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        'promotions',
      );

      return {
        url,
        key,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to upload file: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
