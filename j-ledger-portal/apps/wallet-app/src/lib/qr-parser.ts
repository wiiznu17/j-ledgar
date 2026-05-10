/**
 * QR Parser - Supports only INTERNAL JLEDGER format
 * Format: JLEDGER:<phone>[:<amount>]
 * Example: JLEDGER:0812345678 or JLEDGER:0812345678:100.00
 */

export interface ParsedQR {
  type: 'INTERNAL' | 'UNSUPPORTED';
  recipient: string;
  amount?: string;
  merchantName?: string;
  error?: string;
}

export const parseQRData = (data: string): ParsedQR => {
  // Only accept Internal Wallet ID (e.g., JLEDGER:0812345678 or JLEDGER:0812345678:100.00)
  if (data.startsWith('JLEDGER:')) {
    const parts = data.split(':');
    return {
      type: 'INTERNAL',
      recipient: parts[1] || '',
      amount: parts[2] || undefined,
    };
  }

  // PromptPay and other formats are not supported yet
  if (data.startsWith('000201')) {
    return {
      type: 'UNSUPPORTED',
      recipient: '',
      error:
        'PromptPay QR is not supported yet. Please use JLEDGER QR codes only.',
    };
  }

  return {
    type: 'UNSUPPORTED',
    recipient: '',
    error: 'Invalid QR format. Only JLEDGER QR codes are supported.',
  };
};
