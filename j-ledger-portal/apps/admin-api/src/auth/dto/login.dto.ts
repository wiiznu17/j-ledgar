import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { LoginRequest } from '@repo/dto';

export class LoginDto implements LoginRequest {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
