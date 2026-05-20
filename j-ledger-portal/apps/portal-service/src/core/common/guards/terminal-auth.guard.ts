import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MerchantService } from '../../../modules/merchant/merchant.service';
import { TerminalNonceService } from '../../../modules/merchant/security/terminal-nonce.service';

@Injectable()
export class TerminalAuthGuard implements CanActivate {
  constructor(
    private readonly merchantService: MerchantService,
    private readonly nonceService: TerminalNonceService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const terminalId = request.headers['x-jledger-terminal-id'];
    const signature = request.headers['x-jledger-signature'];
    const timestamp = request.headers['x-jledger-timestamp'];
    const nonce = request.headers['x-jledger-nonce'];

    if (
      typeof terminalId !== 'string' ||
      !terminalId ||
      typeof signature !== 'string' ||
      !signature ||
      typeof timestamp !== 'string' ||
      !timestamp ||
      typeof nonce !== 'string' ||
      !nonce
    ) {
      throw new HttpException(
        'Missing or invalid terminal authentication headers',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const isValid = await this.merchantService.validateTerminalSignature(
      terminalId,
      signature,
      timestamp,
      nonce,
      request.method,
      request.url,
    );

    if (!isValid) {
      throw new HttpException(
        'Invalid terminal signature or expired request',
        HttpStatus.FORBIDDEN,
      );
    }

    // Consume nonce only after signature is verified to prevent nonce poisoning.
    await this.nonceService.validateNonce(terminalId, nonce, timestamp);

    // Attach terminalId to request for use in controllers
    request.terminalId = terminalId;

    return true;
  }
}
