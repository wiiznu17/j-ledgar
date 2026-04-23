import { Injectable } from '@nestjs/common';
import { UserKYCProxyService } from '../proxies/user-kyc-proxy.service';

@Injectable()
export class KYCService {
  constructor(private readonly kycProxy: UserKYCProxyService) {}

  async getPendingKYCList() {
    return this.kycProxy.getPendingKYCList();
  }

  async getKYCHistory(userId: string) {
    return this.kycProxy.getKYCHistory(userId);
  }

  async approveDocument(documentId: string, notes?: string) {
    return this.kycProxy.approveDocument(documentId, notes);
  }

  async rejectDocument(documentId: string, reason: string) {
    return this.kycProxy.rejectDocument(documentId, reason);
  }

  async getAllDocuments() {
    return this.kycProxy.getAllDocuments();
  }

  async getUserDocuments(userId: string) {
    return this.kycProxy.getUserDocuments(userId);
  }

  async getPII(userId: string, field: string) {
    return this.kycProxy.getPII(userId, field);
  }

  async getDocumentById(documentId: string) {
    return this.kycProxy.getDocumentById(documentId);
  }
}
