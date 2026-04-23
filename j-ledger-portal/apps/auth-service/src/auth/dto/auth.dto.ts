import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

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
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  @Matches(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/\d/, { message: 'Password must contain at least one number' })
  @Matches(/[!@#$%^&*(),.?":{}|<>]/, {
    message: 'Password must contain at least one special character',
  })
  @Matches(
    /^(?!.*(123|234|345|456|567|678|789|890|098|987|876|765|654|543|432|321|210|012|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|qwe|wer|ert|rty|tyu|yui|uio|iop|pas|asd|sdf|dfg|fgh|ghj|hjk|jkl))/,
    {
      message: 'Password must not contain sequential characters',
    },
  )
  @Matches(
    /^(?!.*(aaa|bbb|ccc|ddd|eee|fff|ggg|hhh|iii|jjj|kkk|lll|mmm|nnn|ooo|ppp|qqq|rrr|sss|ttt|uuu|vvv|www|xxx|yyy|zzz|111|222|333|444|555|666|777|888|999|000))/,
    {
      message: 'Password must not contain repeating characters',
    },
  )
  @Matches(
    /^(?!.*(password|admin|user|test|guest|root|login|welcome|hello|monkey|dragon|football|baseball|letmein|master|shadow|sunshine|princess|qwerty))/i,
    {
      message: 'Password must not contain common words',
    },
  )
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
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
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
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  @Matches(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/\d/, { message: 'Password must contain at least one number' })
  @Matches(/[!@#$%^&*(),.?":{}|<>]/, {
    message: 'Password must contain at least one special character',
  })
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

export class DataExportDto {
  user!: {
    id: string;
    phoneNumber?: string;
    email?: string;
    status: string;
    createdAt: string;
  };
  profile?: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    address?: string;
    occupation?: string;
    incomeRange?: string;
    sourceOfFunds?: string;
    purposeOfAccount?: string;
  };
  consents!: ConsentRecordDto[];
  devices!: Array<{
    id: string;
    deviceName?: string;
    platform?: string;
    trustLevel: string;
    lastLoginAt?: string;
  }>;
  exportedAt!: string;
}

export class DataDeletionRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(['REQUESTED', 'CONFIRMED', 'CANCELLED'])
  action!: 'REQUESTED' | 'CONFIRMED' | 'CANCELLED';
}

export class BiometricVerifyDto {
  @IsString()
  @IsNotEmpty()
  challenge!: string;

  @IsString()
  @IsOptional()
  biometricType?: 'FINGERPRINT' | 'FACE_ID' | 'IRIS' | 'BIOMETRIC';
}
