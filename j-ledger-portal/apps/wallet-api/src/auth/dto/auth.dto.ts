import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
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

export class AcceptTermsDto {
  @IsString()
  @IsNotEmpty()
  termsVersion!: string;
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
