import { parseQRData as parseRawQRData, ParsedQR } from './qr-parser';
import {
  TransferParamsSchema,
  ValidationResult,
  QRScanLog,
} from '../types/transfer';

// In-memory log storage (will be cleared on app restart)
// For production, consider integrating with backend logging service
let qrScanLogs: QRScanLog[] = [];

/**
 * Validate and parse QR code data into transfer params
 */
export const validateAndParseQR = (rawData: string): ValidationResult => {
  try {
    // Parse raw QR data
    const parsed: ParsedQR = parseRawQRData(rawData);

    // Handle unsupported formats (PromptPay, etc.)
    if (parsed.type === 'UNSUPPORTED') {
      return {
        success: false,
        error: {
          code: 'INVALID_QR',
          message:
            parsed.error ||
            'This QR code format is not supported. Only JLEDGER QR codes are accepted.',
          field: 'format',
        },
      };
    }

    // Validate required fields
    if (!parsed.recipient || parsed.recipient.trim() === '') {
      return {
        success: false,
        error: {
          code: 'INVALID_RECIPIENT',
          message: 'QR code does not contain a valid recipient',
          field: 'recipient',
        },
      };
    }

    // Handle Merchant Payments - Skip phone number validation
    if (parsed.type === 'MERCHANT_PAYMENT') {
      return {
        success: true,
        data: {
          type: 'MERCHANT_PAYMENT',
          recipient: 'MERCHANT',
          paymentId: parsed.paymentId,
          amount: parsed.amount || '',
          merchantName: parsed.merchantName,
        },
      };
    }

    // Handle Merchant Static QR
    if (parsed.type === 'MERCHANT_STATIC') {
      return {
        success: true,
        data: {
          type: 'MERCHANT_STATIC',
          recipient: 'MERCHANT',
          merchantId: parsed.merchantId,
          amount: '',
          merchantName: parsed.merchantName,
        },
      };
    }

    // Normalize recipient to 10-digit phone number for P2P transfers
    let recipient = parsed.recipient.replace(/\D/g, '');
    if (recipient.length === 9) {
      recipient = '0' + recipient;
    }

    if (recipient.length !== 10) {
      return {
        success: false,
        error: {
          code: 'INVALID_RECIPIENT',
          message: 'Recipient phone number is invalid (must be 10 digits)',
          field: 'recipient',
        },
      };
    }

    // Amount is optional for QR - user will enter on transfer screen if not specified
    const amount = parsed.amount || '';

    // Build validation payload - only include amount if QR specifies it
    const validationPayload: any = {
      recipient: recipient,
      merchantName: parsed.merchantName,
    };
    if (amount) {
      validationPayload.amount = amount;
    } else {
      // Pass dummy amount to pass schema validation, but we'll clear it in UI
      validationPayload.amount = '1';
    }

    const validationResult = TransferParamsSchema.safeParse(validationPayload);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues?.[0];
      return {
        success: false,
        error: {
          code: 'INVALID_QR',
          message: firstError?.message || 'Invalid QR code',
          field: firstError?.path?.[0] ? String(firstError.path[0]) : undefined,
        },
      };
    }

    return {
      success: true,
      data: {
        ...validationResult.data,
        // If amount was empty/dummy, mark it as optional
        amount: amount || '',
      },
    };
  } catch (err) {
    console.error('[QR Validation] Parse error:', err);
    return {
      success: false,
      error: {
        code: 'PARSE_ERROR',
        message: 'Failed to parse QR code. Please try again.',
      },
    };
  }
};

/**
 * Log QR scan attempt for audit trail
 */
export const logQRScan = async (log: QRScanLog) => {
  try {
    // Keep only last 100 logs in memory
    qrScanLogs = [log, ...qrScanLogs].slice(0, 100);

    console.log('[QR Logger] Scan logged:', log);
  } catch (err) {
    console.error('[QR Logger] Failed to log scan:', err);
  }
};

/**
 * Get all QR scan logs
 */
export const getQRScanLogs = async (): Promise<QRScanLog[]> => {
  try {
    return qrScanLogs;
  } catch (err) {
    console.error('[QR Logger] Failed to retrieve logs:', err);
    return [];
  }
};

/**
 * Clear QR scan logs
 */
export const clearQRScanLogs = async () => {
  try {
    qrScanLogs = [];
    console.log('[QR Logger] Logs cleared');
  } catch (err) {
    console.error('[QR Logger] Failed to clear logs:', err);
  }
};

/**
 * User-friendly error messages for QR validation errors
 */
export const getErrorMessage = (validationResult: ValidationResult): string => {
  if (!validationResult.error) return '';

  const { code, message } = validationResult.error;

  switch (code) {
    case 'INVALID_QR':
      return 'This QR code is not valid. Please try scanning another code.';
    case 'INVALID_RECIPIENT':
      return 'The QR code does not contain a valid recipient. Please try another code.';
    case 'INVALID_AMOUNT':
      return 'The QR code contains an invalid amount. Please enter an amount manually.';
    case 'PARSE_ERROR':
      return 'Unable to read the QR code. Please try again.';
    default:
      return message || 'An error occurred while scanning. Please try again.';
  }
};
