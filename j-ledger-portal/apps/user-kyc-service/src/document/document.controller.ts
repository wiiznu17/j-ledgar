import {
  Controller,
  Get,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Controller('kyc/documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private documentService: DocumentService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(@Body() dto: UploadDocumentDto, @UploadedFile() file: Express.Multer.File) {
    return this.documentService.uploadDocument(dto.userId, file, dto.documentType);
  }

  @Get('user/:userId')
  getDocuments(@Param('userId') userId: string) {
    return this.documentService.getDocuments(userId);
  }

  // Admin endpoint
  @Get('admin/all')
  getAllDocuments() {
    return this.documentService.getAllDocuments();
  }
}
