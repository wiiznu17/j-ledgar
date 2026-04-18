import { IsNotEmpty, IsString } from 'class-validator';
import { RefreshTokenRequest } from '@repo/dto';

export class RefreshTokenDto implements RefreshTokenRequest {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsNotEmpty()
  @IsString()
  refreshToken!: string;
}
