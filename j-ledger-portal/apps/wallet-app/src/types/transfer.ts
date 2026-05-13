import { z } from 'zod';

/**
 * Transfer request params from QR code or manual entry
 */
export const TransferParamsSchema = z.object({
  recipient: z
    .string()
    .min(1, 'Recipient is required'),
    // Note: Validation is also handled in qr-validation.ts based on QR type
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, 'Amount must be greater than 0'),
  merchantName: z.string().optional(),
  note: z.string().optional(),
});

export type TransferParams = z.infer<typeof TransferParamsSchema>;

/**
 * Validation result from parsing QR data
 */
export interface ValidationResult {
  success: boolean;
  data?: TransferParams;
  error?: {
    code: 'INVALID_QR' | 'INVALID_RECIPIENT' | 'INVALID_AMOUNT' | 'PARSE_ERROR';
    message: string;
    field?: string;
  };
}

/**
 * QR scan log entry for audit trail
 */
export interface QRScanLog {
  timestamp: number;
  type: 'INTERNAL' | 'PROMPTPAY' | 'UNKNOWN';
  recipient?: string;
  amount?: string;
  success: boolean;
  error?: string;
  userId?: string;
}
