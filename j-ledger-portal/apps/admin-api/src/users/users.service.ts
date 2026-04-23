import { Injectable } from '@nestjs/common';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';
import { AdminAuthProxyService } from '../proxies/admin-auth-proxy.service';
import { WalletProxyService } from '../proxies/wallet-proxy.service';
import { AuthProxyService } from '../proxies/auth-proxy.service';
import { UserKYCProxyService } from '../proxies/user-kyc-proxy.service';
import { WalletUser, AdminUser, CreateAdminRequest } from '@repo/dto';

@Injectable()
export class UsersService {
  constructor(
    private proxyService: LedgerProxyService,
    private adminAuthProxy: AdminAuthProxyService,
    private walletProxy: WalletProxyService,
    private authProxy: AuthProxyService,
    private kycProxy: UserKYCProxyService,
  ) {}

  async findAll(): Promise<Partial<AdminUser>[]> {
    // Proxy to admin-auth-service
    return this.adminAuthProxy.getAllStaff();
  }

  async findWalletUsers(): Promise<WalletUser[]> {
    // Proxy to wallet service
    return this.walletProxy.getWalletUsers();
  }

  async create(data: CreateAdminRequest) {
    // Proxy to admin-auth-service
    return this.adminAuthProxy.createStaff(data);
  }

  async remove(id: string) {
    // Proxy to admin-auth-service
    return this.adminAuthProxy.deleteStaff(id);
  }

  /**
   * Freezes a wallet user by proxying to wallet service.
   * The wallet service handles the synchronization with the ledger.
   */
  async freezeWalletUser(userId: string) {
    return this.walletProxy.freezeWalletUser(userId);
  }

  // Customer user management methods
  async getAllCustomers(query: { page?: number; limit?: number }) {
    return this.authProxy.getAllUsers(query);
  }

  async getCustomerById(id: string) {
    return this.authProxy.getUserById(id);
  }

  async searchCustomers(query: string) {
    return this.authProxy.searchUsers(query);
  }

  async updateCustomerStatus(id: string, status: string) {
    return this.authProxy.updateUserStatus(id, status);
  }

  async getCustomerActivity(id: string) {
    return this.authProxy.getUserActivity(id);
  }

  async getCustomerKYC(id: string) {
    return this.kycProxy.getKYCStatus(id);
  }

  async getCustomerPII(id: string, field: string) {
    return this.kycProxy.getPII(id, field);
  }

  async getCustomerWallet(id: string) {
    return this.walletProxy.getWallet(id);
  }

  async freezeCustomerWallet(id: string) {
    return this.walletProxy.freezeWalletUser(id);
  }

  async unfreezeCustomerWallet(id: string) {
    return this.walletProxy.unfreezeWalletUser(id);
  }
}
