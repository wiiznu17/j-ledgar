import { Test, TestingModule } from '@nestjs/testing';
import { KycService } from './kyc.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { FinanceService } from '../../core/finance/finance.service';
import { IdentityService } from '../identity/identity.service';
import { KafkaProducerService } from '../notification/kafka-producer.service';
import { S3Service } from './services/s3.service';
import { GoogleVisionService } from './services/ocr.service';
import { AwsRekognitionService } from './services/face.service';
import { KycCryptoService } from './services/kyc-crypto.service';
import { KycDocumentService } from './services/kyc-document.service';
import { KycAdminService } from './services/kyc-admin.service';
import { KycProcessService } from './services/kyc-process.service';
import {
  KYCVerificationStatus,
  RegistrationState,
  UserStatus,
  KafkaTopic,
} from '@repo/dto';
import {
  createMockPrismaService,
  createMockConfigService,
  createMockFinanceService,
  createMockStorageService,
  createMockGoogleVisionService,
  createMockAwsRekognitionService,
  createMockKafkaProducer,
} from '../../__tests__/test-utils';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('KycService', () => {
  let service: KycService;
  let prisma: any;
  let configService: any;
  let financeService: any;
  let identityService: any;
  let kafkaProducer: any;
  let s3Service: any;
  let googleVisionService: any;
  let awsRekognitionService: any;

  const PII_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 64 hex characters

  beforeEach(async () => {
    prisma = createMockPrismaService();
    configService = createMockConfigService({
      PII_ENCRYPTION_KEY: PII_KEY,
    });
    financeService = createMockFinanceService();
    identityService = {
      validateRegistrationState: jest.fn().mockResolvedValue(undefined),
      logSecurityEvent: jest.fn().mockResolvedValue(undefined),
    };
    kafkaProducer = createMockKafkaProducer();
    s3Service = createMockStorageService();
    googleVisionService = createMockGoogleVisionService();
    awsRekognitionService = createMockAwsRekognitionService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycService,
        KycCryptoService,
        KycDocumentService,
        KycAdminService,
        KycProcessService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: FinanceService,
          useValue: financeService,
        },
        {
          provide: IdentityService,
          useValue: identityService,
        },
        {
          provide: KafkaProducerService,
          useValue: kafkaProducer,
        },
        {
          provide: S3Service,
          useValue: s3Service,
        },
        {
          provide: GoogleVisionService,
          useValue: googleVisionService,
        },
        {
          provide: AwsRekognitionService,
          useValue: awsRekognitionService,
        },
      ],
    }).compile();

    service = module.get<KycService>(KycService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getKYCStatus', () => {
    it('should return APPROVED status when at least 2 documents are approved', async () => {
      prisma.kYCDocument.findMany.mockResolvedValue([
        { status: KYCVerificationStatus.APPROVED },
        { status: KYCVerificationStatus.APPROVED },
        { status: KYCVerificationStatus.REJECTED },
      ]);

      const result = await service.getKYCStatus('user-1');

      expect(result.status).toBe(KYCVerificationStatus.APPROVED);
      expect(result.summary.approved).toBe(2);
      expect(result.summary.rejected).toBe(1);
    });

    it('should return PENDING status when < 2 approved but there is a pending document', async () => {
      prisma.kYCDocument.findMany.mockResolvedValue([
        { status: KYCVerificationStatus.APPROVED },
        { status: KYCVerificationStatus.PENDING },
      ]);

      const result = await service.getKYCStatus('user-2');

      expect(result.status).toBe(KYCVerificationStatus.PENDING);
      expect(result.summary.approved).toBe(1);
      expect(result.summary.pending).toBe(1);
    });
  });

  describe('approveDocument', () => {
    it('should approve document and trigger wallet activation + Kafka event when approvedCount >= 2', async () => {
      const mockDoc = { id: 'doc-1', userId: 'user-1', status: KYCVerificationStatus.PENDING };
      prisma.kYCDocument.findUnique.mockResolvedValue(mockDoc);
      prisma.kYCDocument.update.mockResolvedValue({ ...mockDoc, status: KYCVerificationStatus.APPROVED });
      prisma.kYCDocument.findMany.mockResolvedValue([
        { status: KYCVerificationStatus.APPROVED },
        { status: KYCVerificationStatus.APPROVED },
      ]);
      financeService.activateWallet.mockResolvedValue({ walletId: 'W1' });

      const result = await service.approveDocument('doc-1');

      expect(prisma.kYCDocument.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: { status: KYCVerificationStatus.APPROVED },
      });
      expect(financeService.activateWallet).toHaveBeenCalledWith('user-1');
      expect(kafkaProducer.emit).toHaveBeenCalledWith(
        KafkaTopic.KYC_EVENTS,
        expect.objectContaining({
          userId: 'user-1',
          documentId: 'doc-1',
          status: KYCVerificationStatus.APPROVED,
        }),
      );
      expect(result.status).toBe(KYCVerificationStatus.APPROVED);
    });

    it('should approve document but NOT activate wallet if approvedCount < 2', async () => {
      const mockDoc = { id: 'doc-2', userId: 'user-2', status: KYCVerificationStatus.PENDING };
      prisma.kYCDocument.findUnique.mockResolvedValue(mockDoc);
      prisma.kYCDocument.update.mockResolvedValue({ ...mockDoc, status: KYCVerificationStatus.APPROVED });
      prisma.kYCDocument.findMany.mockResolvedValue([
        { status: KYCVerificationStatus.APPROVED },
      ]);

      await service.approveDocument('doc-2');

      expect(financeService.activateWallet).not.toHaveBeenCalled();
      expect(kafkaProducer.emit).toHaveBeenCalled();
    });
  });

  describe('approveKyc', () => {
    it('should verify KYC, create a new wallet if none exists, and update registrationState', async () => {
      const mockKyc = { userId: 'user-1', verificationStatus: KYCVerificationStatus.PENDING };
      prisma.kYCData.findUnique.mockResolvedValue(mockKyc);
      prisma.kYCData.update.mockResolvedValue({ ...mockKyc, verificationStatus: KYCVerificationStatus.APPROVED });
      
      const mockUser = { id: 'user-1', ledgerAccountId: null, phoneNumber: '0812345678', registrationState: RegistrationState.TC_ACCEPTED };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      
      financeService.createWallet.mockResolvedValue({ walletId: 'W_NEW' });
      financeService.createAccount.mockResolvedValue({ id: 'acc-rewards' });

      const result = await service.approveKyc('user-1');

      expect(prisma.kYCData.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: expect.objectContaining({
          verificationStatus: KYCVerificationStatus.APPROVED,
        }),
      });
      expect(financeService.createWallet).toHaveBeenCalledWith('user-1', 'THB');
      expect(prisma.user.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'user-1' },
        data: { ledgerAccountId: 'W_NEW' },
      });
      expect(financeService.createAccount).toHaveBeenCalledWith('user-1', 'Wallet: 0812345678');
      expect(prisma.user.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'user-1' },
        data: {
          status: UserStatus.ACTIVE,
          registrationState: RegistrationState.KYC_VERIFIED,
        },
      });
      expect(result.verificationStatus).toBe(KYCVerificationStatus.APPROVED);
    });

    it('should activate wallet if it already exists and not regress registrationState if already verified', async () => {
      const mockKyc = { userId: 'user-2', verificationStatus: KYCVerificationStatus.PENDING };
      prisma.kYCData.findUnique.mockResolvedValue(mockKyc);
      prisma.kYCData.update.mockResolvedValue({ ...mockKyc, verificationStatus: KYCVerificationStatus.APPROVED });

      const mockUser = { id: 'user-2', ledgerAccountId: 'W_EXISTING', phoneNumber: '0887654321', registrationState: RegistrationState.KYC_VERIFIED };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await service.approveKyc('user-2');

      expect(financeService.activateWallet).toHaveBeenCalledWith('user-2');
      expect(financeService.createWallet).not.toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: {
          status: UserStatus.ACTIVE,
        },
      });
    });
  });

  describe('PII Encryption & Decryption', () => {
    it('should securely encrypt and decrypt PII data using AES-256-GCM', () => {
      const sensitiveData = 'My Secret PII Data 1234';
      
      const encrypted = (service as any).encryptPii(sensitiveData);
      expect(encrypted).toContain(':');
      
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3); // iv : authTag : cipherText
      
      const decrypted = (service as any).decryptPii(encrypted);
      expect(decrypted).toBe(sensitiveData);
    });
  });

  describe('uploadIdCard', () => {
    it('should validate registration, upload to S3, call OCR, prevent duplication, and create liveness session', async () => {
      const sampleBuffer = Buffer.from('fake-id-card-image');
      googleVisionService.extractIdCardData.mockResolvedValue({
        idNumber: '1234567890123',
        prefixTh: 'นาย',
        firstNameTh: 'สมชาย',
        lastNameTh: 'ใจดี',
        registeredAddress: '123 Test Rd',
      });

      // No existing Kyc duplicate
      prisma.kYCData.findUnique.mockResolvedValue(null);

      const result = await service.uploadIdCard('user-1', sampleBuffer);

      expect(identityService.validateRegistrationState).toHaveBeenCalledWith('user-1', [
        RegistrationState.TC_ACCEPTED,
        RegistrationState.ID_CARD_UPLOADED,
      ]);
      expect(s3Service.uploadFile).toHaveBeenCalledWith(
        'kyc/user-1/id-card.jpg',
        sampleBuffer,
        'image/jpeg',
      );
      expect(googleVisionService.extractIdCardData).toHaveBeenCalledWith(sampleBuffer);
      expect(awsRekognitionService.createLivenessSession).toHaveBeenCalled();
      expect(result.extractedData.idNumber).toBe('1234567890123');
      expect(result.livenessSessionId).toBe('mock-liveness-session-id');
    });

    it('should throw ConflictException if the ID card is already registered with another user', async () => {
      const sampleBuffer = Buffer.from('fake-id-card-image');
      googleVisionService.extractIdCardData.mockResolvedValue({
        idNumber: '9999999999999',
      });

      // Simulating duplicates
      prisma.kYCData.findUnique.mockResolvedValue({
        userId: 'other-user-id',
        idCardToken: 'some-token',
      });

      await expect(
        service.uploadIdCard('user-1', sampleBuffer),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getKYCDetails', () => {
    it('should return kyc details, decrypt PII, and fetch reviewing Staff name if verified', async () => {
      const encryptedAddress = (service as any).encryptPii('123 Main St');
      const encryptedId = (service as any).encryptPii('1234567890123');

      prisma.kYCData.findUnique.mockResolvedValue({
        userId: 'user-1',
        idCardNumberEncrypted: encryptedId,
        firstNameTh: 'Somchai',
        lastNameTh: 'Jaidee',
        registeredAddress: encryptedAddress,
        verifiedBy: 'staff-admin-1',
        idCardImageUrl: 'http://s3/id.jpg',
        selfieImageUrl: 'http://s3/selfie.jpg',
      });

      prisma.kYCDocument.findMany.mockResolvedValue([
        { id: 'doc-1', documentType: 'ID_CARD', url: 'http://s3/id.jpg' },
      ]);

      prisma.auditLog.findMany.mockResolvedValue([
        { id: 'log-1', adminUserId: 'staff-admin-1', resourceId: 'user-1', resourceType: 'KYC_DOCUMENT' },
      ]);

      prisma.staff.findMany.mockResolvedValue([
        { id: 'staff-admin-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      ]);

      const result = await service.getKYCDetails('user-1');

      expect(result.kycData.firstNameTh).toBe('Somchai');
      expect(result.kycData.idCardNumberEncrypted).toBe('1234567890123');
      expect(result.history[0].adminUser.firstName).toBe('John');
      expect(s3Service.getPresignedUrl).toHaveBeenCalled();
    });
  });
});
