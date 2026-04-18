export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  pin?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  userId: string;
  role: string;
}

export interface RefreshTokenRequest {
  userId: string;
  refreshToken: string;
}

export interface TransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  currency: string;
}

export interface CreateAdminRequest {
  email: string;
  password: string;
  role: string;
}

export interface TopUpRequest {
  amount: number;
  channel: string;
  accountId: string;
}

export interface ScanPayRequest {
  qrCodeData: string;
  amount: number;
}

export interface PinSetupRequest {
  pin: string;
}

export interface DeviceBindingRequest {
  deviceId: string;
}

export interface PinVerifyRequest {
  pin: string;
}
