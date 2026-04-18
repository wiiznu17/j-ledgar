import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum } from 'class-validator';
import { CreateAdminRequest, UserRole } from '@repo/dto';

export class CreateAdminDto implements CreateAdminRequest {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;
}
