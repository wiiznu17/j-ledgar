import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { LedgerProxyModule } from '../ledger-proxy/ledger-proxy.module';
import { ProxiesModule } from '../proxies/proxies.module';

@Module({
  imports: [LedgerProxyModule, ProxiesModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
