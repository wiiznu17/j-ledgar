import { Module } from '@nestjs/common';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';
import { LedgerProxyModule } from '../ledger-proxy/ledger-proxy.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [LedgerProxyModule, UserModule],
  controllers: [QrController],
  providers: [QrService],
})
export class QrModule {}
