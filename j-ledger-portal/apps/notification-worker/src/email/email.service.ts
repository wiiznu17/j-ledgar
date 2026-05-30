import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || '',
      },
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: Array<{ filename: string; content: string | Buffer; contentType?: string }>,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@jledger.io',
        to,
        subject,
        html,
        attachments,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }
}
