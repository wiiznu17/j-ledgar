/**
 * QR Parser - Supports only INTERNAL JLEDGER format
 * Format: JLEDGER:<phone>[:<amount>]
 * Example: JLEDGER:0812345678 or JLEDGER:0812345678:100.00
 */

export interface ParsedQR {
  type: 'INTERNAL' | 'MERCHANT_PAYMENT' | 'MERCHANT_STATIC' | 'UNSUPPORTED';
  recipient: string;
  amount?: string;
  merchantName?: string;
  paymentId?: string;
  merchantId?: string;
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

  // Merchant Static QR format: jledger://merchant?id=...
  if (data.startsWith('jledger://merchant')) {
    const urlParts = data.split('?');
    const queryParams = urlParts[1]?.split('&') || [];
    const idParam = queryParams.find((p) => p.startsWith('id='));
    const merchantId = idParam?.split('=')[1];

    if (merchantId) {
      return {
        type: 'MERCHANT_STATIC',
        recipient: 'MERCHANT',
        merchantId,
      };
    }
  }

  // Merchant Payment URL format: jledger://pay?id=...
  if (data.startsWith('jledger://pay')) {
    const urlParts = data.split('?');
    const queryParams = urlParts[1]?.split('&') || [];
    const idParam = queryParams.find((p) => p.startsWith('id='));
    const paymentId = idParam?.split('=')[1];

    if (paymentId) {
      return {
        type: 'MERCHANT_PAYMENT',
        recipient: 'MERCHANT',
        paymentId,
      };
    }
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
