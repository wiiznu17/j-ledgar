import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import * as nodemailer from 'nodemailer';

const mockSendMail = jest.fn();

jest.mock('nodemailer', () => {
  return {
    createTransport: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockImplementation((...args) => mockSendMail(...args)),
    }),
  };
});

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    mockSendMail.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should successfully send an email using nodemailer transporter', async () => {
    mockSendMail.mockResolvedValue({ messageId: 'msg-123' });
    process.env.SMTP_FROM = 'test-from@jledger.io';

    await service.sendEmail('recipient@example.com', 'Test Subject', '<p>Hello World</p>');

    expect(nodemailer.createTransport).toHaveBeenCalled();
    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'test-from@jledger.io',
      to: 'recipient@example.com',
      subject: 'Test Subject',
      html: '<p>Hello World</p>',
    });
  });

  it('should throw error and log failure when nodemailer sendMail fails', async () => {
    const error = new Error('SMTP connection error');
    mockSendMail.mockRejectedValue(error);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      service.sendEmail('recipient@example.com', 'Subject', '<p>Fail</p>'),
    ).rejects.toThrow(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send email:', error);
    consoleErrorSpy.mockRestore();
  });
});
