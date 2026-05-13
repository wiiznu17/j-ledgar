import { IsString, IsOptional, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTerminalDto {
  @ApiProperty({ example: 'Main Branch POS 1', description: 'Display name for the terminal' })
  @IsString()
  @Length(3, 50)
  name: string;

  @ApiProperty({ example: 'HW-A1B2C3D4', required: false, description: 'Optional hardware identifier' })
  @IsString()
  @IsOptional()
  @Length(4, 32)
  @Matches(/^[A-Z0-9-]+$/, { message: 'Hardware ID must only contain uppercase letters, numbers, and hyphens' })
  hardwareId?: string;
}
