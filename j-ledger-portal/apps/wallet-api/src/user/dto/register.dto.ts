import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { RegisterRequest } from '@repo/dto';

export class RegisterDto implements RegisterRequest {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  pin?: string;
}
