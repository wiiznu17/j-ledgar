/**
 * Simple PromptPay QR Parser (EMVCo Standard)
 * This utility parses the standard PromptPay QR strings to extract
 * recipient info and amount.
 */

export interface ParsedQR {
  type: 'PROMPTPAY' | 'INTERNAL' | 'UNKNOWN';
  recipient: string;
  amount?: string;
  merchantName?: string;
}

export const parseQRData = (data: string): ParsedQR => {
  // 1. Check for Internal Wallet ID (e.g., JLEDGER:0812345678)
  if (data.startsWith('JLEDGER:')) {
    const parts = data.split(':');
    return {
      type: 'INTERNAL',
      recipient: parts[1] || '',
    };
  }

  // 2. Check for PromptPay (EMVCo covers CRC16 and tagging)
  // Standard PromptPay start with 000201
  if (data.startsWith('000201')) {
    const result: ParsedQR = {
      type: 'PROMPTPAY',
      recipient: '',
    };

    // Very basic EMVCo parsing logic
    // Format: [Tag(2)][Length(2)][Value]
    let index = 0;
    while (index < data.length) {
      const tag = data.substring(index, index + 2);
      const length = parseInt(data.substring(index + 2, index + 4));
      if (isNaN(length)) break; // Safety break
      const value = data.substring(index + 4, index + 4 + length);

      if (tag === '54') {
        // Tag 54 is Amount
        result.amount = value;
      } else if (tag === '59') {
        // Tag 59 is Merchant Name (Standard EMVCo)
        result.merchantName = value;
      } else if (tag === '29' || tag === '30') {
        // Tag 29 or 30 (Merchant Account Information) - Subtags needed
        // Subtag 01 is often the Proxy ID (Phone/ID Card)
        // For standard PromptPay, we search for the ID inside
        if (value.includes('0066')) {
          const phoneMatch = value.match(/0066(\d+)/);
          if (phoneMatch) result.recipient = '0' + phoneMatch[1];
        } else if (result.recipient === '') {
          // Fallback if no phone pattern
          result.recipient = value.length > 20 ? 'Merchant ID' : value;
        }
      }

      index += 4 + length;
    }

    return result;
  }

  return { type: 'UNKNOWN', recipient: data };
};
