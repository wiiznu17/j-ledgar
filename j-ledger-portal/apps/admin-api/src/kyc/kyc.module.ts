import { Module } from '@nestjs/common';
import { KYCService } from './kyc.service';
import { KYCController } from './kyc.controller';
import { ProxiesModule } from '../proxies/proxies.module';

@Module({
  imports: [ProxiesModule],
  controllers: [KYCController],
  providers: [KYCService],
  exports: [KYCService],
})
export class KYCModule {}
