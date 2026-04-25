import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class InternalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const internalSecret = request.headers['x-internal-secret'];
    const expectedSecret = process.env.JLEDGER_INTERNAL_SECRET || 'jledger_ecosystem_secret_2024';

    if (internalSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid internal secret');
    }

    return true;
  }
}
