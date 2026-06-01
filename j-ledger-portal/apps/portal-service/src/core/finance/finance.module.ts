import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FinanceService } from './finance.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
