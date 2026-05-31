import { Exclude, Expose } from 'class-transformer';
import { AdminUser, AdminRole } from '@repo/dto';

/**
 * Standardized Staff Response DTO
 */
export class StaffResponseDto implements AdminUser {
  @Expose() id!: string;
  @Expose() username!: string;
  @Expose() email!: string;
  @Expose() firstName!: string;
  @Expose() lastName!: string;
  @Expose() isActive!: boolean;
  @Expose() role!: AdminRole;
  @Expose() createdAt!: Date | string;
  @Expose() updatedAt?: Date | string;

  @Exclude() password?: string;
  @Exclude() refreshTokenHash?: string;
  @Exclude() resetToken?: string;

  constructor(partial: Partial<StaffResponseDto>) {
    Object.assign(this, partial);
  }
}
