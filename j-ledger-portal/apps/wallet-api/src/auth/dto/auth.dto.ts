import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { 
  LoginRequest, 
  PinSetupRequest, 
  DeviceBindingRequest, 
  PinVerifyRequest 
} from '@repo/dto';

export class LoginDto implements LoginRequest {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}

export class PinSetupDto implements PinSetupRequest {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  pin!: string;
}

export class DeviceBindingDto implements DeviceBindingRequest {
  @IsString()
  @IsNotEmpty()
  deviceId!: string;
}

export class PinVerifyDto implements PinVerifyRequest {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  pin!: string;
}
