import { Injectable, Logger } from '@nestjs/common';
import { KycCryptoService } from './services/kyc-crypto.service';
import { KycDocumentService } from './services/kyc-document.service';
import { KycAdminService } from './services/kyc-admin.service';
import { KycProcessService } from './services/kyc-process.service';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    private readonly cryptoService: KycCryptoService,
    private readonly documentService: KycDocumentService,
    private readonly adminService: KycAdminService,
    private readonly processService: KycProcessService,
  ) {}

  async getKYCStatus(userId: string) {
    return this.documentService.getKYCStatus(userId);
  }

  async approveDocument(documentId: string) {
    return this.documentService.approveDocument(documentId);
  }

  async rejectDocument(documentId: string, reason: string) {
    return this.documentService.rejectDocument(documentId, reason);
  }

  async approveKyc(userId: string) {
    return this.adminService.approveKyc(userId);
  }

  async rejectKyc(userId: string, reason: string) {
    return this.adminService.rejectKyc(userId, reason);
  }

  async retryKyc(userId: string) {
    return this.adminService.retryKyc(userId);
  }

  async getKYCList(
    status?: string,
    phoneNumber?: string,
    startDate?: string,
    endDate?: string,
    page?: number,
    limit?: number,
  ) {
    return this.adminService.getKYCList(
      status,
      phoneNumber,
      startDate,
      endDate,
      page,
      limit,
    );
  }

  async getKYCStats(from?: string, to?: string) {
    return this.adminService.getKYCStats(from, to);
  }

  async getActiveUsersCount() {
    return this.adminService.getActiveUsersCount();
  }

  async getActiveUsersCountBefore(date: Date) {
    return this.adminService.getActiveUsersCountBefore(date);
  }

  async getKycApprovedCountBetween(from: Date, to: Date) {
    return this.adminService.getKycApprovedCountBetween(from, to);
  }

  async getPendingKYCList() {
    return this.adminService.getPendingKYCList();
  }

  async getKYCHistory(userId: string) {
    return this.documentService.getKYCHistory(userId);
  }

  async getKYCDetails(userId: string) {
    return this.adminService.getKYCDetails(userId);
  }

  async uploadIdCard(userId: string, idCardImage: Buffer) {
    return this.processService.uploadIdCard(userId, idCardImage);
  }

  async submitSelfie(userId: string, selfieImage?: Buffer) {
    return this.processService.submitSelfie(userId, selfieImage);
  }

  async uploadIdCardSimple(userId: string, idCardImage: Buffer) {
    return this.processService.uploadIdCardSimple(userId, idCardImage);
  }

  async confirmOcrData(userId: string, dto: any) {
    return this.processService.confirmOcrData(userId, dto);
  }

  async submitSelfieSimple(userId: string, selfieImage: Buffer) {
    return this.processService.submitSelfieSimple(userId, selfieImage);
  }

  // ==================== Private Helper Delegates for Backward Compatibility ====================

  private parseDate(dateStr: string | null): Date | null {
    return this.cryptoService.parseDate(dateStr);
  }

  private mapMonth(monthStr: string): number {
    return this.cryptoService.mapMonth(monthStr);
  }

  private encryptPii(data: string): string {
    return this.cryptoService.encryptPii(data);
  }

  private decryptPii(encryptedData: string): string {
    return this.cryptoService.decryptPii(encryptedData);
  }

  private hashBuffer(buffer: Buffer): string {
    return this.cryptoService.hashBuffer(buffer);
  }

  private hashString(str: string): string {
    return this.cryptoService.hashString(str);
  }

  private maskIdCardNumber(id: string): string {
    return this.cryptoService.maskIdCardNumber(id);
  }
}
