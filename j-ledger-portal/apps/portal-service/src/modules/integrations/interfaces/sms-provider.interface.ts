export interface ISmsProvider {
  /**
   * Sends a plain text SMS message to a given phone number.
   * @param phoneNumber The recipient's phone number in E.164 format.
   * @param message The text message content.
   */
  sendMessage(phoneNumber: string, message: string): Promise<void>;
}

export const ISmsProvider = Symbol('ISmsProvider');
