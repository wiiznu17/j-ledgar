import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * Error Code Registry Service
 * Manages application-wide error codes with i18n support
 *
 * Features:
 * - Centralized error code management
 * - Thai (TH) + English (EN) error messages
 * - User-friendly error descriptions
 * - HTTP status code mapping
 * - Error categorization (AUTH, VALIDATION, BUSINESS, SYSTEM)
 *
 * Thailand compliance:
 * - Descriptive messages for regulatory violations
 * - Audit trail for compliance violations
 * - AML/CFT specific error codes
 */
@Injectable()
export class ErrorCodeService {
  private readonly logger = new Logger(ErrorCodeService.name);
  private errorCodes: Map<string, ErrorCodeDefinition> = new Map();

  constructor(private prisma: PrismaService) {
    this.initializeErrorCodes();
  }

  /**
   * Get error code definition with i18n support
   * @param code - Error code (e.g., 'INSUFFICIENT_FUNDS')
   * @param language - Language code ('TH' or 'EN', default 'EN')
   * @returns Error message and HTTP status
   */
  getErrorCode(code: string, language: 'TH' | 'EN' = 'EN'): ErrorCodeMessage {
    const definition = this.errorCodes.get(code) || this.errorCodes.get('INTERNAL_ERROR');

    if (!definition) {
      this.logger.warn(`Unknown error code: ${code}`);
      return {
        code: 'INTERNAL_ERROR',
        status: 500,
        message: language === 'TH' ? 'ระบบเกิดข้อผิดพลาด' : 'System error occurred',
        description: language === 'TH' ? 'โปรดลองอีกครั้ง' : 'Please try again',
      };
    }

    return {
      code: definition.code,
      status: definition.httpStatus,
      message: language === 'TH' ? definition.messageTh : definition.messageEn,
      description: language === 'TH' ? definition.descriptionTh : definition.descriptionEn,
      category: definition.category,
    };
  }

  /**
   * Log error for audit trail
   * @param userId - User ID (optional)
   * @param code - Error code
   * @param context - Additional context
   */
  async logError(
    userId: string | undefined,
    code: string,
    context: Record<string, any> = {},
  ): Promise<void> {
    try {
      await this.prisma.errorLog.create({
        data: {
          userId: userId || null,
          errorCode: code,
          context,
          createdAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log error: ${code}`, {
        context,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Initialize error codes for the application
   * @private
   */
  private initializeErrorCodes(): void {
    // Authentication & Authorization
    this.errorCodes.set('UNAUTHORIZED', {
      code: 'UNAUTHORIZED',
      httpStatus: 401,
      messageEn: 'Unauthorized',
      messageTh: 'ไม่ได้รับอนุญาต',
      descriptionEn: 'Please sign in to continue',
      descriptionTh: 'โปรดลงชื่อเข้าใช้เพื่อดำเนินการต่อ',
      category: 'AUTH',
    });

    this.errorCodes.set('FORBIDDEN', {
      code: 'FORBIDDEN',
      httpStatus: 403,
      messageEn: 'Forbidden',
      messageTh: 'ห้ามไม่ให้เข้าถึง',
      descriptionEn: 'You do not have permission to perform this action',
      descriptionTh: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้',
      category: 'AUTH',
    });

    // KYC & Verification
    this.errorCodes.set('KYC_NOT_VERIFIED', {
      code: 'KYC_NOT_VERIFIED',
      httpStatus: 403,
      messageEn: 'KYC verification required',
      messageTh: 'ต้องยืนยันตัวตนก่อน',
      descriptionEn: 'Complete KYC verification to enable transfers. Required by Bank of Thailand.',
      descriptionTh: 'โปรดยืนยันตัวตนเพื่อเปิดใช้งานการโอนเงิน (ตามที่กำหนดโดยธนาคารแห่งประเทศไทย)',
      category: 'BUSINESS',
    });

    this.errorCodes.set('KYC_REJECTED', {
      code: 'KYC_REJECTED',
      httpStatus: 403,
      messageEn: 'KYC verification rejected',
      messageTh: 'ยืนยันตัวตนไม่ผ่าน',
      descriptionEn: 'Your KYC verification was rejected. Please contact support.',
      descriptionTh: 'การยืนยันตัวตนของคุณถูกปฏิเสธ โปรดติดต่อสนับสนุน',
      category: 'BUSINESS',
    });

    // PIN & Security
    this.errorCodes.set('PIN_INVALID', {
      code: 'PIN_INVALID',
      httpStatus: 400,
      messageEn: 'Invalid PIN',
      messageTh: 'รหัส PIN ไม่ถูกต้อง',
      descriptionEn: 'The PIN you entered is incorrect',
      descriptionTh: 'รหัส PIN ที่คุณป้อนไม่ถูกต้อง',
      category: 'VALIDATION',
    });

    this.errorCodes.set('ACCOUNT_LOCKED', {
      code: 'ACCOUNT_LOCKED',
      httpStatus: 403,
      messageEn: 'Account locked',
      messageTh: 'บัญชีถูกล็อก',
      descriptionEn:
        'Your account is locked due to multiple failed PIN attempts. Try again in 30 minutes.',
      descriptionTh:
        'บัญชีของคุณถูกล็อกเนื่องจากการป้อน PIN ผิดหลายครั้ง โปรดลองอีกครั้งในอีก 30 นาที',
      category: 'SECURITY',
    });

    this.errorCodes.set('PIN_NOT_SET', {
      code: 'PIN_NOT_SET',
      httpStatus: 400,
      messageEn: 'PIN not configured',
      messageTh: 'ยังไม่ได้ตั้งค่า PIN',
      descriptionEn: 'Please set up a PIN in settings before transferring',
      descriptionTh: 'โปรดตั้งค่า PIN ในการตั้งค่าก่อนทำการโอนเงิน',
      category: 'BUSINESS',
    });

    // Transfer Validation
    this.errorCodes.set('INSUFFICIENT_FUNDS', {
      code: 'INSUFFICIENT_FUNDS',
      httpStatus: 400,
      messageEn: 'Insufficient balance',
      messageTh: 'ยอดเงินในบัญชีไม่เพียงพอ',
      descriptionEn: 'Your account balance is insufficient for this transfer',
      descriptionTh: 'ยอดเงินในบัญชีของคุณไม่เพียงพอสำหรับการโอนเงินครั้งนี้',
      category: 'BUSINESS',
    });

    this.errorCodes.set('INVALID_RECIPIENT', {
      code: 'INVALID_RECIPIENT',
      httpStatus: 400,
      messageEn: 'Invalid recipient',
      messageTh: 'ผู้รับเงินไม่ถูกต้อง',
      descriptionEn: 'Recipient phone number not found or account is not active',
      descriptionTh: 'ไม่พบเบอร์โทรศัพท์ผู้รับเงินหรือบัญชีไม่ทำงาน',
      category: 'VALIDATION',
    });

    this.errorCodes.set('SELF_TRANSFER_NOT_ALLOWED', {
      code: 'SELF_TRANSFER_NOT_ALLOWED',
      httpStatus: 400,
      messageEn: 'Cannot transfer to yourself',
      messageTh: 'ไม่สามารถโอนเงินให้ตัวเอง',
      descriptionEn: 'Please select a different recipient',
      descriptionTh: 'โปรดเลือกผู้รับเงินที่ต่างกัน',
      category: 'VALIDATION',
    });

    this.errorCodes.set('INVALID_AMOUNT', {
      code: 'INVALID_AMOUNT',
      httpStatus: 400,
      messageEn: 'Invalid transfer amount',
      messageTh: 'จำนวนการโอนไม่ถูกต้อง',
      descriptionEn:
        'Amount must be between 100 satoshi (1 THB) and 10,000,000 satoshi (100,000 THB)',
      descriptionTh:
        'จำนวนเงินต้องอยู่ระหว่าง 100 satoshi (1 บาท) และ 10,000,000 satoshi (100,000 บาท)',
      category: 'VALIDATION',
    });

    // AML/CFT - Thailand Compliance
    this.errorCodes.set('HIGH_VALUE_APPROVAL_REQUIRED', {
      code: 'HIGH_VALUE_APPROVAL_REQUIRED',
      httpStatus: 202,
      messageEn: 'High-value transfer approval required',
      messageTh: 'ต้องได้รับการอนุมัติสำหรับการโอนเงินจำนวนมาก',
      descriptionEn: 'Transfers over 100,000 THB require admin approval (AML/CFT compliance)',
      descriptionTh:
        'การโอนเงินมากกว่า 100,000 บาท ต้องได้รับการอนุมัติจากผู้ดูแลระบบ (ตามข้อกำหนด AML/CFT)',
      category: 'BUSINESS',
    });

    this.errorCodes.set('EXCEEDS_DAILY_LIMIT', {
      code: 'EXCEEDS_DAILY_LIMIT',
      httpStatus: 400,
      messageEn: 'Daily transfer limit exceeded',
      messageTh: 'เกินขีดจำกัดการโอนรายวัน',
      descriptionEn: 'You have exceeded your daily transfer limit. Try again tomorrow.',
      descriptionTh: 'คุณเกินขีดจำกัดการโอนรายวัน โปรดลองอีกครั้งในวันพรุ่งนี้',
      category: 'BUSINESS',
    });

    this.errorCodes.set('SUSPICIOUS_ACTIVITY_DETECTED', {
      code: 'SUSPICIOUS_ACTIVITY_DETECTED',
      httpStatus: 403,
      messageEn: 'Suspicious activity detected',
      messageTh: 'ตรวจพบกิจกรรมที่น่าสงสัย',
      descriptionEn: 'Your account has been temporarily restricted for security. Contact support.',
      descriptionTh: 'บัญชีของคุณถูกจำกัดชั่วคราวด้วยเหตุผลด้านความปลอดภัย โปรดติดต่อสนับสนุน',
      category: 'SECURITY',
    });

    // Idempotency & Duplicate Prevention
    this.errorCodes.set('DUPLICATE_TRANSFER', {
      code: 'DUPLICATE_TRANSFER',
      httpStatus: 200,
      messageEn: 'Transfer already processed',
      messageTh: 'การโอนเงินถูกประมวลผลแล้ว',
      descriptionEn: 'This transfer was already processed. Showing previous result.',
      descriptionTh: 'การโอนเงินนี้ถูกประมวลผลแล้ว แสดงผลลัพธ์ก่อนหน้า',
      category: 'BUSINESS',
    });

    // Ledger Service Errors
    this.errorCodes.set('LEDGER_UNAVAILABLE', {
      code: 'LEDGER_UNAVAILABLE',
      httpStatus: 503,
      messageEn: 'Ledger service temporarily unavailable',
      messageTh: 'บริการจดหมายรับประกันไม่พร้อมใช้งาน',
      descriptionEn: 'Please try again in a few moments',
      descriptionTh: 'โปรดลองอีกครั้งในอีกสักครู่',
      category: 'SYSTEM',
    });

    this.errorCodes.set('CONCURRENT_TRANSFER', {
      code: 'CONCURRENT_TRANSFER',
      httpStatus: 409,
      messageEn: 'Transfer in progress',
      messageTh: 'การโอนเงินในการดำเนิน',
      descriptionEn: 'Another transfer is in progress. Please try again in a moment.',
      descriptionTh: 'มีการโอนเงินอื่นในการดำเนินอยู่ โปรดลองอีกครั้งในอีกสักครู่',
      category: 'BUSINESS',
    });

    // Generic Errors
    this.errorCodes.set('VALIDATION_ERROR', {
      code: 'VALIDATION_ERROR',
      httpStatus: 400,
      messageEn: 'Validation error',
      messageTh: 'ข้อผิดพลาดในการตรวจสอบ',
      descriptionEn: 'Please check your input and try again',
      descriptionTh: 'โปรดตรวจสอบการป้อนข้อมูลของคุณและลองอีกครั้ง',
      category: 'VALIDATION',
    });

    this.errorCodes.set('INTERNAL_ERROR', {
      code: 'INTERNAL_ERROR',
      httpStatus: 500,
      messageEn: 'Internal server error',
      messageTh: 'ข้อผิดพลาดของเซิร์ฟเวอร์ภายใน',
      descriptionEn: 'Please try again later or contact support',
      descriptionTh: 'โปรดลองอีกครั้งในภายหลังหรือติดต่อสนับสนุน',
      category: 'SYSTEM',
    });

    this.logger.debug(`Initialized ${this.errorCodes.size} error codes`);
  }
}

// Interfaces

export interface ErrorCodeDefinition {
  code: string;
  httpStatus: number;
  messageEn: string;
  messageTh: string;
  descriptionEn: string;
  descriptionTh: string;
  category: 'AUTH' | 'VALIDATION' | 'BUSINESS' | 'SECURITY' | 'SYSTEM';
}

export interface ErrorCodeMessage {
  code: string;
  status: number;
  message: string;
  description: string;
  category?: string;
}
