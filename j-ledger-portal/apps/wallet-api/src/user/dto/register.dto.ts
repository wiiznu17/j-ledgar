import { IsNotEmpty, IsString, Length, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @Length(8, 20)
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  pin!: string;
}
