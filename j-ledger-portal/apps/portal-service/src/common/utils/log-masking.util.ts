export class LogMaskingUtil {
  static maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 6) return "***";
    return phone.replace(/^(.{2})(.*)(.{2})$/, "$1****$3");
  }

  static maskEmail(email: string): string {
    if (!email || !email.includes("@")) return "***";
    const [local, domain] = email.split("@");
    const maskedLocal = local[0] + "***";
    return `${maskedLocal}@${domain}`;
  }

  static maskUUID(uuid: string): string {
    if (!uuid || uuid.length < 8) return "***";
    return uuid.substring(0, 8) + "****";
  }

  static maskPassword(): string {
    return "***REDACTED***";
  }
}
