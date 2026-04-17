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
    const deviceId = request.headers['x-device-id'];

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 1. Verify Device ID
    if (!user.deviceId) {
      throw new ForbiddenException('Device not bound. Please bind your device first.');
    }
    if (user.deviceId !== deviceId) {
      throw new ForbiddenException('Invalid device ID');
    }

    // 2. Check Lockout status
    if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.pinLockedUntil.getTime() - Date.now()) / (60 * 1000),
      );
      throw new ForbiddenException(
        `Account locked. Please try again in ${remainingMinutes} minutes.`,
      );
    }

    // 3. Verify PIN
    if (!pin) {
      throw new UnauthorizedException('X-Transaction-PIN header is required');
    }

    const isValid = await this.authService.validatePinByUserId(userId, pin);

    if (isValid) {
      // Success: Reset attempts
      if (user.pinAttempts > 0 || user.pinLockedUntil) {
        await this.userService.resetPinAttempts(userId);
      }
      return true;
    } else {
      // Failure: Increment attempts and maybe lock
      await this.userService.handlePinFailure(userId);
      const updatedUser = await this.userService.findById(userId);
      const remainingAttempts = 3 - updatedUser.pinAttempts;

      if (updatedUser.pinAttempts >= 3) {
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
