import { Injectable } from '@nestjs/common';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';
import { AdminAuthProxyService } from '../proxies/admin-auth-proxy.service';
import { WalletProxyService } from '../proxies/wallet-proxy.service';
import { WalletUser, AdminUser, CreateAdminRequest } from '@repo/dto';

@Injectable()
export class UsersService {
  constructor(
    private proxyService: LedgerProxyService,
    private adminAuthProxy: AdminAuthProxyService,
    private walletProxy: WalletProxyService,
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
}
