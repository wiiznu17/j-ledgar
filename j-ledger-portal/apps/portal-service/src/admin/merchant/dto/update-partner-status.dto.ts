import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePartnerStatusDto {
  @ApiProperty({
    example: true,
    description: 'True to activate, false to deactivate',
  })
  @IsBoolean()
  status: boolean;
}
