import { IsNotEmpty, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';

export class RegisterInitDto {
  @IsString()
  @IsNotEmpty()
  @Length(8, 20)
  phoneNumber!: string;
}

export class RegisterVerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  @Length(8, 20)
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  challengeId!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  otp!: string;
}

export class RegisterPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  @Matches(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/\d/, { message: 'Password must contain at least one number' })
  @Matches(/[!@#$%^&*(),.?":{}|<>]/, {
    message: 'Password must contain at least one special character',
  })
  password!: string;
}

export class RegisterPinDto {
  @IsString()
  @Matches(/^\d{6}$/)
  pin!: string;

  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @IsString()
  @IsOptional()
  deviceName?: string;
}

export class AcceptTermsDto {
  @IsString()
  @IsNotEmpty()
  termsVersion!: string;

  @IsString()
  @IsOptional()
  privacyPolicyVersion?: string;

  @IsOptional()
  marketingConsent?: boolean;

  @IsOptional()
  biometricConsent?: boolean;
}

export class RegisterProfileDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  occupation?: string;

  @IsString()
  @IsNotEmpty()
  incomeRange!: string;

  @IsString()
  @IsNotEmpty()
  sourceOfFunds!: string;

  @IsString()
  @IsNotEmpty()
  purposeOfAccount!: string;
}

export class RegisterCredentialsDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  @Matches(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/\d/, { message: 'Password must contain at least one number' })
  @Matches(/[!@#$%^&*(),.?":{}|<>]/, {
    message: 'Password must contain at least one special character',
  })
  password!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  pin!: string;

  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @IsString()
  @IsOptional()
  deviceName?: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @IsString()
  @IsOptional()
  deviceName?: string;
}

export class DeviceVerifyDto {
  @IsString()
  @IsNotEmpty()
  @Length(8, 20)
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  challengeId!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  otp!: string;

  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @IsString()
  @IsOptional()
  deviceName?: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class PinSetupDto {
  @IsString()
  @Matches(/^\d{6}$/)
  pin!: string;
}

export class PinVerifyDto {
  @IsString()
  @Matches(/^\d{6}$/)
  pin!: string;
}

export class WithdrawConsentDto {
  @IsString()
  @IsNotEmpty()
  consentType!: string;
}

export class ConsentRecordDto {
  id!: string;
  consentType!: string;
  status!: string;
  consentVersion!: string;
  consentedAt!: string;
  withdrawnAt?: string;
}
