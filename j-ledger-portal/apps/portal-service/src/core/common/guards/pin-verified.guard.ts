import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class PinVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Check for 'pvn' (PIN Verified Now) claim in the JWT payload
    // This claim is only set to true when the token is generated/refreshed via PIN verification
    if (user.pvn !== true) {
      throw new UnauthorizedException(
        'PIN verification required for this transaction',
      );
    }

    return true;
  }
}
