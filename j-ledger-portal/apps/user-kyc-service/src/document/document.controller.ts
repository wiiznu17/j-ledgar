import { Controller, Get, Post, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private documentService: DocumentService) {}

  @Post('upload/:userId/:documentType')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @Param('userId') userId: string,
    @Param('documentType') documentType: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentService.uploadDocument(userId, file, documentType);
  }

  @Get('user/:userId')
  getDocuments(@Param('userId') userId: string) {
    return this.documentService.getDocuments(userId);
  }
}
