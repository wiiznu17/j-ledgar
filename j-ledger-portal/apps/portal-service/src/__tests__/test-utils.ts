export const createMockPrismaService = () => {
  const mockMethods = {
    $transaction: jest.fn((cb) => {
      if (typeof cb === 'function') {
        return cb(mockPrisma);
      }
      return Promise.resolve(cb);
    }),
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  };

  const handler = {
    get(target: any, prop: string) {
      if (prop in mockMethods) {
        return (mockMethods as any)[prop];
      }
      if (!target[prop]) {
        target[prop] = new Proxy({}, {
          get(modelTarget: any, modelProp: string) {
            if (!modelTarget[modelProp]) {
              modelTarget[modelProp] = jest.fn().mockResolvedValue(null);
            }
            return modelTarget[modelProp];
          }
        });
      }
      return target[prop];
    }
  };

  const mockPrisma = new Proxy({}, handler);
  return mockPrisma;
};

export const createMockRedisClient = () => {
  return {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    setex: jest.fn(),
    exists: jest.fn(),
    incr: jest.fn(),
  };
};

export const createMockKafkaProducer = () => {
  return {
    emit: jest.fn().mockResolvedValue(undefined),
  };
};

export const createMockConfigService = (envOverrides: Record<string, any> = {}) => {
  const defaults: Record<string, any> = {
    CUSTOMER_JWT_SECRET: 'test-jwt-secret',
    CUSTOMER_REFRESH_SECRET: 'test-refresh-secret',
    CUSTOMER_REGISTRATION_SECRET: 'test-registration-secret',
    FINANCE_SERVICE_URL: 'http://localhost:8081',
    STRIPE_SECRET_KEY: 'sk_test_mock',
    JLEDGER_INTERNAL_SECRET: 'mock_internal_secret',
    ...envOverrides,
  };
  return {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key in defaults) return defaults[key];
      return defaultValue;
    }),
  };
};

export const createMockFinanceService = () => {
  return {
    createWallet: jest.fn(),
    createAccount: jest.fn(),
    getSystemSettings: jest.fn().mockResolvedValue({
      vatRate: 0.07,
      minMerchantPayment: 100,
      feeRate: 0.03,
      minP2pTransfer: 10,
      perTransactionLimit: 50000,
      merchantFeeRate: 0.03,
    }),
    updateSystemSettings: jest.fn(),
    getFeeConfiguration: jest.fn(),
    updateFeeConfiguration: jest.fn(),
    getAccountDetail: jest.fn(),
    getAccountsByType: jest.fn(),
    getLedgerEntriesForAccount: jest.fn(),
    activateWallet: jest.fn(),
    getWallet: jest.fn(),
    getTransactions: jest.fn(),
    getTransactionByUuid: jest.fn(),
    getLinkedBankAccounts: jest.fn(),
    topUp: jest.fn(),
    performTransfer: jest.fn(),
    performMerchantMultiPay: jest.fn(),
    previewP2PTransfer: jest.fn(),
    transferP2P: jest.fn(),
    transferByPhone: jest.fn().mockResolvedValue({ id: 'txn-123' }),
    createPaymentIntent: jest.fn().mockResolvedValue({ id: 'pi-mock-123' }),
    processPaymentWebhook: jest.fn().mockResolvedValue({ success: true }),
  };
};

export const createMockAuditService = () => {
  return {
    log: jest.fn().mockResolvedValue(undefined),
    findAll: jest.fn(),
    getAuditStats: jest.fn(),
  };
};

export const createMockStorageService = () => {
  return {
    uploadFile: jest.fn().mockResolvedValue('http://mock-storage/file'),
    getSignedUrl: jest.fn().mockResolvedValue('http://mock-storage/file-signed'),
    getPresignedUrl: jest.fn().mockResolvedValue('http://mock-storage/file-presigned'),
  };
};

export const createMockHttpService = () => {
  return {
    axiosRef: {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      request: jest.fn().mockResolvedValue({ data: {} }),
    },
  };
};

export const createMockGoogleVisionService = () => {
  return {
    extractIdCardData: jest.fn().mockResolvedValue({
      idNumber: '1234567890123',
      prefixTh: 'นาย',
      firstNameTh: 'สมชาย',
      lastNameTh: 'ใจดี',
      prefixEn: 'Mr.',
      firstNameEn: 'Somchai',
      lastNameEn: 'Jaidee',
      dateOfBirth: '2000-01-01',
      idCardIssueDate: '2020-01-01',
      idCardExpiryDate: '2030-01-01',
      religion: 'Buddhism',
      registeredAddress: '123 Bangkok Road',
    }),
  };
};

export const createMockAwsRekognitionService = () => {
  return {
    createLivenessSession: jest.fn().mockResolvedValue('mock-liveness-session-id'),
  };
};

export const createMockBannerService = () => {
  return {
    getActiveBanners: jest.fn().mockResolvedValue([]),
  };
};
