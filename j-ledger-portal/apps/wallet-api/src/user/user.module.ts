import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { LedgerProxyModule } from '../ledger-proxy/ledger-proxy.module';

@Module({
  imports: [LedgerProxyModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
