import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';

export class CreateStaffDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  roleIds?: string[];
}
