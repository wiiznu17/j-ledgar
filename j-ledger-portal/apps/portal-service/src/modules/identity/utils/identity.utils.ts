export class IdentityUtils {
  static normalizePhone(phone: string): string {
    const digits = (phone || '').replace(/\D/g, '');
    // Convert to +66 format (E.164)
    if (digits.startsWith('66') && digits.length === 11) {
      return `+66${digits.slice(2)}`;
    }
    if (digits.startsWith('0') && digits.length === 10) {
      return `+66${digits.slice(1)}`;
    }
    if (digits.length === 9) {
      return `+66${digits}`;
    }
    // If already has + prefix, keep it
    if (phone.startsWith('+')) {
      return phone;
    }
    // Default: assume Thai number and add +66
    return `+66${digits}`;
  }

  static getPhoneCandidates(phone: string): string[] {
    const e164 = this.normalizePhone(phone);
    const digits = e164.replace(/\D/g, '');
    // Generate variations for backward compatibility during search
    const local = `0${digits.slice(2)}`;
    return [...new Set([e164, local])];
  }
}
