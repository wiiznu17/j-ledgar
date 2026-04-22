import { Injectable, Logger, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { ISmsProvider } from '../../interfaces/sms-provider.interface';

@Injectable()
export class FirebaseAuthAdapter implements ISmsProvider {
  private readonly logger = new Logger(FirebaseAuthAdapter.name);
  private firebaseApp: admin.app.App;

  constructor(private readonly configService: ConfigService) {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase Credentials missing for FirebaseAuthAdapter');
    }

    this.firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    }, 'jledger-wallet');
  }

  /**
   * Note: In Firebase Auth Phone workflow, the SMS is sent by the Client SDK.
   * This method satisfies the ISmsProvider interface but might be used
   * for custom SMS logic if needed.
   */
  async sendMessage(phoneNumber: string, message: string): Promise<void> {
    this.logger.warn('sendMessage called on FirebaseAuthAdapter. Firebase typically handles SMS via Client SDK.');
    // Implementing a dummy or basic send logic if using Firebase Cloud Messaging is out of scope
    // Use verifyIdToken instead for the main auth flow.
  }

  /**
   * Verifies the Firebase ID Token sent from the Mobile App.
   * Implements "Phone Swapping Protection" by checking the token's phone number.
   * @param idToken The token from the client.
   * @param expectedPhoneNumber The phone number user registered with.
   */
  async verifyPhoneToken(idToken: string, expectedPhoneNumber: string): Promise<void> {
    this.logger.log(`Verifying Firebase token for ${expectedPhoneNumber}...`);

    try {
      const decodedToken = await this.firebaseApp.auth().verifyIdToken(idToken);
      const tokenPhoneNumber = decodedToken.phone_number;

      if (!tokenPhoneNumber) {
        throw new UnauthorizedException('Token does not contain a verified phone number');
      }

      // Assert phone number match (Normalize both for comparison)
      const normalizedTokenPhone = this.normalizePhone(tokenPhoneNumber);
      const normalizedExpectedPhone = this.normalizePhone(expectedPhoneNumber);

      if (normalizedTokenPhone !== normalizedExpectedPhone) {
        this.logger.error(`Phone Swapping Detected! Token: ${normalizedTokenPhone}, Expected: ${normalizedExpectedPhone}`);
        throw new UnauthorizedException('Phone number in token does not match registered phone number');
      }

      this.logger.log(`Firebase token verified successfully for ${normalizedTokenPhone}`);
    } catch (error: any) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error(`Firebase Auth Error: ${error.message}`);
      throw new InternalServerErrorException('Authentication verification failed');
    }
  }

  private normalizePhone(phone: string): string {
    // Remove all non-digits except leading +
    return phone.replace(/[^\d+]/g, '');
  }
}
