import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TerminalRedeemDto {
  @ApiProperty({
    example: 'RED-123-456',
    description: 'The unique redemption code',
  })
  @IsString()
  @Length(8, 32, { message: 'Invalid redemption code format' })
  redemptionCode: string;

  @ApiProperty({
    example: 'req_redeem_1234567890',
    description: 'Unique idempotency key',
  })
  @IsString()
  @Length(16, 64, {
    message: 'Idempotency key must be between 16 and 64 characters',
  })
  idempotencyKey: string;
}
