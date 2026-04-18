import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../user/user.service';

@Injectable()
export class TransactionPinGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;
    const pin = request.headers['x-transaction-pin'];
    const deviceIdentifier = request.headers['x-device-id'];

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!deviceIdentifier || Array.isArray(deviceIdentifier)) {
      throw new UnauthorizedException('X-Device-Id header is required');
    }

    const trustedDeviceId = await this.userService.getTrustedDeviceIdByIdentifier(
      userId,
      deviceIdentifier,
    );
    if (!trustedDeviceId) {
      throw new ForbiddenException('Invalid device ID');
    }

    if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.pinLockedUntil.getTime() - Date.now()) / (60 * 1000),
      );
      throw new ForbiddenException(
        `Account locked. Please try again in ${remainingMinutes} minutes.`,
      );
    }

    if (!pin || Array.isArray(pin)) {
      throw new UnauthorizedException('X-Transaction-PIN header is required');
    }

    const isValid = await this.authService.validatePinByUserId(userId, pin);

    if (isValid) {
      if (user.pinAttempts > 0 || user.pinLockedUntil) {
        await this.userService.resetPinAttempts(userId);
      }
      return true;
    } else {
      const updatedUser = await this.userService.handlePinFailure(userId);
      const MAX_ATTEMPTS = 3;
      const remainingAttempts = MAX_ATTEMPTS - updatedUser.pinAttempts;

      if (updatedUser.pinAttempts >= MAX_ATTEMPTS) {
        throw new ForbiddenException(
          'Account locked due to too many failed attempts. Please try again in 5 minutes.',
        );
      } else {
        throw new UnauthorizedException(
          `Invalid PIN. ${remainingAttempts} attempts remaining.`,
        );
      }
    }
  }
}
