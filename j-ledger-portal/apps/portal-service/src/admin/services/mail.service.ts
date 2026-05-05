import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  /**
   * Mock sending an invitation email to a new staff member.
   * In a real application, this would integrate with AWS SES, SendGrid, etc.
   */
  async sendAdminInvite(email: string, token: string): Promise<void> {
    const resetLink = `http://localhost:3000/system/admins/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    
    this.logger.log(`
=========================================================
📩 [MOCK EMAIL] ADMIN INVITATION
=========================================================
To: ${email}
Subject: Welcome to J-Ledger Admin Portal!

You have been invited to join the J-Ledger Admin team.
Please click the link below to set up your password:

🔗 ${resetLink}

This link will expire in 24 hours.
=========================================================
    `);
  }

  /**
   * Mock sending a password reset email to an existing staff member.
   */
  async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetLink = `http://localhost:3000/system/admins/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    
    this.logger.log(`
=========================================================
📩 [MOCK EMAIL] PASSWORD RESET REQUEST
=========================================================
To: ${email}
Subject: Reset your J-Ledger Admin Password

We received a request to reset your admin password.
Please click the link below to choose a new password:

🔗 ${resetLink}

If you did not request this, please ignore this email.
=========================================================
    `);
  }
}
